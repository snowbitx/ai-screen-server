import { MessagesValue, StateSchema } from '@langchain/langgraph'

export const State = new StateSchema({
  // MessagesValue 节点状态会与之前的节点返回值合并
  messages: MessagesValue,
})
