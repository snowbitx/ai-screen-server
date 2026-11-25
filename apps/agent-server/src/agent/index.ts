import { START, StateGraph } from '@langchain/langgraph'
import { State } from './state.js'
import {
  handleEditTask,
  handleMessageTask,
  handlePageTask,
} from './task-nodes/index.js'
import { classifyTask } from './classification.js'

// 每个node均是一个函数，行参是state，节点返回值都会合并入state中
const builder = new StateGraph(State)
  .addNode('classifyTask', classifyTask)
  .addNode('handleMessageTask', handleMessageTask)
  .addNode('handlePageTask', handlePageTask)
  .addNode('handleEditTask', handleEditTask)
  .addEdge(START, 'classifyTask')

  .addConditionalEdges('classifyTask', state => state.classification.task, {
    message: 'handleMessageTask',
    page: 'handlePageTask',
    edit: 'handleEditTask',
  })

// addConditionalEdges(
//   source,      // 从哪个节点出发
//   path,        // 路由函数，返回一个 key 或节点名
//   pathMap?     // key 到实际节点名的映射
// )
export const graph = builder.compile()

graph.name = 'ScreenDesignAgent'
