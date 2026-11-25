// ai-screen-server/apps/agent-server/src/ai/model.ts
import { ChatOpenAI, type ChatOpenAIFields } from '@langchain/openai'

type CreateChatModelOptions = Omit<ChatOpenAIFields, 'streaming'> & {
  disableStreaming?: boolean
}

export function createChatModel({
  disableStreaming = false,
  ...fields
}: CreateChatModelOptions = {}) {
  return new ChatOpenAI({
    model: process.env.AI_MODEL,
    ...fields,
    streaming: !disableStreaming,
    // 使用 Responses API
    useResponsesApi: true,
    // 开启零数据保留，Responses API 不会存储请求和响应
    zdrEnabled: true,
    configuration: {
      baseURL: process.env.AI_BASE_URL,
      apiKey: process.env.AI_API_KEY,
      ...fields.configuration,
    },
  })
}

export function createNonStreamingModel(
  options?: ConstructorParameters<typeof ChatOpenAI>[0]
) {
  return createChatModel({
    ...options,
    disableStreaming: true,
    tags: ['nostream'],
  })
}
