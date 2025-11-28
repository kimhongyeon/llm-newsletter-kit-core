const chainObj = { invoke: async () => 'CRAWLING_RESULT' };
const calls: any[] = [];
function CrawlingChainMock(args: any) {
  calls.push([args]);
  return { chain: chainObj } as any;
}
const __getCalls = () => calls;
const __resetCrawlingCalls = () => {
  calls.length = 0;
};

const crawlingChainMock = {
  default: CrawlingChainMock,
  chainObj,
  __getCalls,
  __resetCrawlingCalls,
};

export default crawlingChainMock;
