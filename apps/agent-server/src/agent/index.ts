import { END, START, StateGraph } from '@langchain/langgraph'
import { State } from './state.js'
import { handleMessageTask } from './task-nodes/index.js'

// 每个node均是一个函数，行参是state，节点返回值都会合并入state中
const builder = new StateGraph(State)
  .addNode('answerMessage', handleMessageTask)
  .addEdge(START, 'answerMessage')
  .addEdge('answerMessage', END)

export const graph = builder.compile()

graph.name = 'ScreenDesignAgent'
