const chainObj = { invoke: async () => 'CONTENT_RESULT' };
const calls: any[] = [];
function ContentGenerateChainMock(args: any) {
  calls.push([args]);
  return { chain: chainObj } as any;
}
const __getCalls = () => calls;
const __resetContentCalls = () => {
  calls.length = 0;
};

const contentGenerateChainMock = {
  default: ContentGenerateChainMock,
  chainObj,
  __getCalls,
  __resetContentCalls,
};

export default contentGenerateChainMock;
