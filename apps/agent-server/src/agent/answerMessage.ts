import { createChatModel } from '../ai/model.js'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

export const answerMessage = async state => {
  const model = createChatModel()
  const { page, selectedNodeIds, messages, schema } = state
  const nodes = page.nodes
  const canvas = page.canvas
  const { material, canvas: canvasSchema } = schema
  // messages 消息列表还需要在列表展示
  const _messages = [...messages]
  const lastMessage = _messages.pop()
  const result = await model.invoke([
    new SystemMessage('你是一个AI大屏设计器助手，帮助用户设计大屏页面'),
    ..._messages,
    new HumanMessage(`
    用户问题：${lastMessage.text}

    以下内容是编辑器的状态：

    ${JSON.stringify({ nodes, selectedNodeIds, canvas }, null, 2)}

    其中：
    - nodes：当前页面的全部节点。
    - selectedNodeIds：用户当前选中的节点，是 nodes 的子集。
    - canvas：当前画布的状态。
    
    以下是 canvas 画布 的schema定义：
    ${JSON.stringify(canvasSchema, null, 2)}
    
    以下是所有可用物料的 schema 定义：
    ${JSON.stringify(material, null, 2)}
  `),
  ])
  return {
    messages: [result],
  }
}
