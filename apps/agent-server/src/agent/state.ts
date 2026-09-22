import { MessagesValue, StateSchema } from '@langchain/langgraph'
import { z } from 'zod'

export const State = new StateSchema({
  // MessagesValue 节点状态会与之前的节点返回值合并
  messages: MessagesValue,
  // 表示是对象 第一个参数是 key需要是字符串，第二个参数是对象的值 可以转json的数据（非map和set）
  page: z.record(z.string(), z.json()),
  selectedNodeIds: z.array(z.string()),
  schema: z.object({
    material: z.array(z.record(z.string(), z.json())),
    canvas: z.record(z.string(), z.json()),
  }),
})
