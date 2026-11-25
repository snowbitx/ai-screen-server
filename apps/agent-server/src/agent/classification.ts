// apps/agent-server/src/agent/classification.ts
import { z } from 'zod'
import { SystemMessage } from '@langchain/core/messages'
import { createChatModel } from '../ai/model.js'
import { getLastUserMessage } from '../utils/index.js'
import type { State } from './state.js'

// 大模型可以识别用户意图，但 Graph 不能依靠一段自然语言描述来选择下一个节点。
export const ClassificationSchema = z.object({
  task: z
    .enum(['message', 'page', 'edit'])
    .describe(
      '识别用户意图的任务分类，message = 普通问答，page = 创建页面，edit = 修改页面'
    ),
  operation: z
    .enum(['add_node', 'update_node'])
    .nullable()
    .describe(
      '当前开放的二级分类：add_node = 新增一个节点，update_node = 修改一个节点'
    ),
})

export async function classifyTask(state: typeof State.State) {
  const chatModel = createChatModel({
    disableStreaming: true,
  })

  const model = chatModel.withStructuredOutput(ClassificationSchema, {
    name: 'task_classification',
    method: 'jsonSchema',
  })

  const lastUserMessage = getLastUserMessage(state.messages)

  if (!lastUserMessage) {
    throw new Error('classifyTask: 未找到用户消息')
  }

  const classification = await model.invoke([
    new SystemMessage(`
    你是一个 AI 大屏设计器的意图识别助手，请根据用户输入返回一级任务分类和当前支持的二级分类。

    一级任务分类：
    - message: 普通问答，用户只是想问一些问题，或者获取一些信息。
    - page: 创建完整页面，用户想用一句话或者一段综合描述生成一个大屏。
    - edit: 修改当前页面，包括新增节点、修改节点或者删除节点。

    目前只有 edit 有二级分类 operation：
    - add_node: 用户明确要求新增一个节点，例如新增一个标题、一段文本或一个图表。
    - update_node: 用户要求修改当前选中的一个节点，例如修改文本内容、字号、颜色或图表配置。

    规则：
    - 用户明确要求新增一个节点时，operation 返回 add_node。
    - 用户明确要求修改当前选中的一个节点时，operation 返回 update_node。
    - message、page、新增多个节点、删除节点以及其他情况，operation 都返回 null。
  `),
    getLastUserMessage(state.messages),
  ])

  const { task, operation } = classification

  return {
    classification: {
      task,
      operation,
    },
  }
}
