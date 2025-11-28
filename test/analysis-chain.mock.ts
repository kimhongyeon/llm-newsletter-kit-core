const chainObj = { invoke: async () => 'ANALYSIS_RESULT' };
const calls: any[] = [];
function AnalysisChainMock(args: any) {
  calls.push([args]);
  return { chain: chainObj } as any;
}
const __getCalls = () => calls;
const __resetAnalysisCalls = () => {
  calls.length = 0;
};

const analysisChainMock = {
  default: AnalysisChainMock,
  chainObj,
  __getCalls,
  __resetAnalysisCalls,
};

export default analysisChainMock;
