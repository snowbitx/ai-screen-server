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

  const response = await model.invoke(
    [
      new SystemMessage(`
        你是一个 AI 大屏设计器助手，根据用户提示词进行意图识别。
        分类结果只能是 message、page、edit：
        - message：普通问答，尤其是询问当前页面、节点或数据源事实。
        - page：创建一个完整页面或大屏。
        - edit：修改当前页面。
      `),
      lastUserMessage,
    ],
    {
      tags: ['nostream'],
    }
  )

  const { task } = response

  return {
    classification: {
      task,
    },
  }
}
