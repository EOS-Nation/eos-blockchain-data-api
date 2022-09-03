import path from "node:path"
import ws from "ws";
import * as grpc from "@grpc/grpc-js"
import ProtoBuf from "protobufjs"
import * as protoLoader from "@grpc/proto-loader"
import { createDfuseClient, InMemoryApiTokenStore } from "@dfuse/client"
import { timeout, __dirname } from "./utils"
import { Block } from "./firehose"
import 'dotenv/config'

// Global required by dfuse client
global.fetch = fetch as any;
global.WebSocket = ws as any;

// env variables
const DFUSE_TOKEN = process.env.DFUSE_TOKEN;
const DFUSE_FIREHOSE_NETWORK = process.env.DFUSE_FIREHOSE_NETWORK || "eos.firehose.eosnation.io";
const DFUSE_DFUSE_NETWORK = process.env.DFUSE_DFUSE_NETWORK || "eos.dfuse.eosnation.io";
const EXIT_TIMEOUT_MS = Number(process.env.EXIT_TIMEOUT_MS ?? 3000);
if (!DFUSE_TOKEN) throw new Error("[DFUSE_TOKEN] is required");
if (!DFUSE_FIREHOSE_NETWORK) throw new Error("[DFUSE_FIREHOSE_NETWORK] is required");
if (!DFUSE_DFUSE_NETWORK) throw new Error("[DFUSE_DFUSE_NETWORK] is required");

// protobufs
export const bstreamProto = loadProto("dfuse/bstream/v1/bstream.proto")
export const eosioProto = loadProto("dfuse/eosio/codec/v1/codec.proto")
export const bstreamService = loadGrpcPackageDefinition("dfuse/bstream/v1/bstream.proto").dfuse.bstream.v1

export const blockMsg = bstreamProto.root.lookupType("dfuse.bstream.v1.Block")
export const eosioBlockMsg = eosioProto.root.lookupType("dfuse.eosio.codec.v1.Block")
export const forkStepEnum = bstreamProto.root.lookupEnum("dfuse.bstream.v1.ForkStep")

export const forkStepIrreversible = forkStepEnum.values["STEP_IRREVERSIBLE"]

function loadGrpcPackageDefinition(pkg: any): any {
    const protoPath = path.resolve(__dirname, "proto", pkg)
    const proto = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    })
    return grpc.loadPackageDefinition(proto)
}

function loadProto(pkg: any) {
    const protoPath = path.resolve(__dirname, "proto", pkg)
    return ProtoBuf.loadSync(protoPath)
}

interface StreamError {
    details: string;
    code: number;
    metadata: any;
}

// dfuse clients
export const firehose = createDfuseClient({
    apiKey: DFUSE_TOKEN,
    network: DFUSE_FIREHOSE_NETWORK,
    apiTokenStore: new InMemoryApiTokenStore()
})

export const dfuse = createDfuseClient({
    apiKey: DFUSE_TOKEN,
    network: DFUSE_DFUSE_NETWORK,
    apiTokenStore: new InMemoryApiTokenStore()
})

export async function streamBlocks( start_block_num: number, stop_block_num: number, callback: (block: Block) => void, options: { exclude_filter_expr?: string; include_filter_expr?: string } = {} ) {
    console.log("streamBlocks", {start_block_num, stop_block_num, options});
    const client = new bstreamService.BlockStreamV2(
        `${DFUSE_FIREHOSE_NETWORK}:9000`,
        grpc.credentials.createSsl(), {
        "grpc.max_receive_message_length": 1024 * 1024 * 100,
        "grpc.max_send_message_length": 1024 * 1024 * 100
        }
    )

    const token = (await firehose.getTokenInfo()).token;
    const metadata = new grpc.Metadata()
    metadata.set("authorization", token);

    // active variables
    let last_block_num: number;

    const stream = client.Blocks({
        start_block_num,
        stop_block_num,
        exclude_filter_expr: options.exclude_filter_expr,
        include_filter_expr: options.include_filter_expr,
        fork_steps: [forkStepIrreversible],
    }, metadata );


    async function exitStream(message: string, resolve: (value: any) => void) {
        console.log("exitStream", {message});
        cancelStream(message);
        console.log(`exiting in ${EXIT_TIMEOUT_MS}ms...`);
        await timeout(EXIT_TIMEOUT_MS);
        resolve(message);
    }

    function cancelStream(message: string) {
        console.log("cancelStream", {message});
        try { client.close(); } catch (e) { console.error({error: e}); }
        try { firehose.release(); } catch (e) { console.error({error: e}); }
        try { if ( stream ) stream.cancel(); } catch (e) { console.error({error: e}); }
    }

    async function errorStream(message: string, error: StreamError, resolve: (value: any ) => void ) {
        const details = error?.details;
        if ( details == "Cancelled") return; // ignore, being handled by exitStream
        console.log("errorStream", {message, details, last_block_num});
        if ( details.match("unable to create preproc function") ) return exitStream(message, resolve );
        cancelStream(message);
        console.log("restart in 3s...");
        await timeout(3000);
        streamBlocks(last_block_num, stop_block_num, callback, options );
    }

    function onData( data: any, resolve: (value: any) => void ) {
        const { block: rawBlock } = data;
        if (rawBlock.type_url !== "type.googleapis.com/dfuse.eosio.codec.v1.Block") {
            exitStream("[type_url] invalid", resolve);
        }
        const block: Block = eosioBlockMsg.decode(rawBlock.value) as any;
        last_block_num = block.number;
        callback(block);
    }

    return new Promise((resolve) => {
        process.on('SIGINT', () => exitStream("SIGINT", resolve));
        stream.on("data", (data: any) => onData( data, resolve));
        stream.on("end", () => exitStream("stream.on::end", resolve));
        stream.on("error", (error: any) => errorStream("stream.on::error", error, resolve ));
    })
}

export async function get_blocks(start_date: string, stop_date: string ) {
    const start_block = (await dfuse.fetchBlockIdByTime(start_date, "eq")).block;
    const stop_block = (await dfuse.fetchBlockIdByTime(stop_date, "lt")).block;
    dfuse.release();
    return { start_block, stop_block };
}