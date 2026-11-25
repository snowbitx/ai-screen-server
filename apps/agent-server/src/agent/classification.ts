// apps/agent-server/src/agent/classification.ts
import { z } from 'zod'
import { SystemMessage } from '@langchain/core/messages'
import { createChatModel } from '../ai/model.js'
import type { State } from './state.js'

// 大模型可以识别用户意图，但 Graph 不能依靠一段自然语言描述来选择下一个节点。
export const ClassificationSchema = z.object({
  task: z
    .enum(['message', 'page', 'edit'])
    .describe(
      '识别用户意图的任务分类，message = 普通问答，page = 创建页面，edit = 修改页面'
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

  const classification = await model.invoke([
    new SystemMessage(`
    你是一个 AI 大屏设计器的意图识别助手，请根据用户输入返回一级任务分类。

    一级任务分类：
    - message: 普通问答，用户只是想问一些问题，或者获取一些信息。
    - page: 创建完整页面，用户想用一句话或者一段综合描述生成一个大屏。
    - edit: 修改当前页面，包括一个或多个节点的新增、修改、删除，以及这些操作的组合。
  `),
    ...state.messages,
  ])

  const { task } = classification

  return {
    classification: {
      task,
    },
  }
}
