import type { NextApiRequest, NextApiResponse } from 'next'
import { Block } from "../../src/firehose"
import { __dirname } from "../../src/utils"
import { streamBlocks, get_blocks } from "../../src/dfuse";

// 2022-08-09T06:00:00Z
// 2022-08-09T06:09:59Z

export default async (req: NextApiRequest, res: NextApiResponse) => {
  setCache(res);

  // params
  const start_date = String(req.query.start_date);
  const stop_date = String(req.query.stop_date);

  // filters
  const include_filter_expr = '';
  const exclude_filter_expr = 'action == "*"'

  // data containers
  let actions = 0;
  let transactions = 0;
  let cpuUsageMicroSeconds = 0;
  let netUsage = 0;
  const accounts = new Set<string>();

  function callback(block: Block) {
    // compute
    actions += block.filteredExecutedTotalActionCount;
    transactions += block.filteredTransactionCount;

    // filtering actual trades and duplicated mine actions in a single block
    for ( const trace of block.filteredTransactionTraces ) {

      // resource usage
      netUsage += Number(trace.netUsage);
      cpuUsageMicroSeconds += trace.receipt.cpuUsageMicroSeconds;

      // daily active users
      for ( const { action } of trace.actionTraces ) {
        for ( const authorization of action.authorization ) {
          accounts.add(authorization.actor);
        }
      }
    }
  }

  try {
    const { start_block, stop_block } = await get_blocks( start_date, stop_date );
    await streamBlocks(start_block.num, stop_block.num, callback, {include_filter_expr, exclude_filter_expr});
    return res.status(200).json({
        start_block,
        stop_block,
        transactions,
        actions,
        cpu_usage: cpuUsageMicroSeconds,
        net_usage: netUsage,
        active_accounts: accounts.size,
        // accounts: Array.from(accounts).sort(),
    });
    // error handling
  } catch (e: any) {
    return res.status(400).json( { error: e.message ?? e });
  }
}

export function setCache( res: NextApiResponse, cache = 's-maxage=1, stale-while-revalidate=59' ) {
  const headers = {
      'Cache-Control': cache,
      'Access-Control-Allow-Origin': '*'
  }
  for ( const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
  }
}