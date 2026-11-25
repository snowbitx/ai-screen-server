// ai-screen-server/apps/agent-server/src/agent/task-nodes/edit.ts
import { createNonStreamingModel } from '../../ai/model.js'
import { z } from 'zod'
import { AIMessage, SystemMessage } from '@langchain/core/messages'
import { getLastUserMessage } from '../../utils/index.js'

/**
 * 处理编辑类任务，目前仅支持新增节点
 */
export async function handleEditTask(state) {
  if (state.classification.operation === 'add_node') {
    const selectedMaterial = await getMaterialSchema(state)
    const node = await generateNode(state, selectedMaterial)

    return {
      action: {
        type: 'add_node',
        node,
      },
    }
  }

  if (state.classification?.operation === 'update_node') {
    const selectedNodeId = state.selectedNodeIds[0]

    if (!selectedNodeId) {
      return {
        messages: [
          new AIMessage('当前没有选中任何节点，请先选中一个节点再进行修改。'),
        ],
      }
    }

    // 找到选中的节点
    const currentNode = state.page.nodes.find(
      node => node.id === selectedNodeId
    )

    // 找到选中节点的物料schema
    const materialSchema = state.schema.material.find(
      item => item.type === currentNode.type
    )

    const node = await updateNode(state, currentNode, materialSchema)

    return {
      action: {
        type: 'update_node',
        node,
      },
    }
  }
  return {
    messages: [
      new AIMessage('当前暂时只支持新增节点，其他编辑能力后续再实现。'),
    ],
  }
}

/**
 * 根据用户需求，从当前页面的可用物料中选择最合适的一个
 */
async function getMaterialSchema(state) {
  const materials = state.schema.material.map(item => ({
    type: item.type,
    name: item.name,
  }))

  const model = createNonStreamingModel().withStructuredOutput(
    z.object({
      type: z
        .enum(materials.map(item => item.type))
        .describe('根据用户需求选择的物料类型'),
    }),
    {
      // 如果是jsonSchema 此处只作 排查name使用，如果是工具 则是工具名称
      name: 'material_selection',
      // 决定走 OpenAI 的 Structured Outputs，而不是工具调用（functionCalling）
      method: 'jsonSchema',
    }
  )

  const res = await model.invoke([
    new SystemMessage(`
      你是一个 AI 大屏设计器的物料选择助手。
      请根据用户的要求，从下面的可用物料中选择最合适的一个。
      可用物料：
      ${JSON.stringify(materials, null, 2)}
    `),
    getLastUserMessage(state.messages),
  ])

  return state.schema.material.find(item => item.type === res.type)
}

/**
 * 基于物料配置的 Schema 生成节点内容，并补充节点唯一 ID
 */
function generateNode(state, materialSchema) {
  const schema = z.fromJSONSchema(materialSchema.configSchema) as z.ZodObject

  const model = createNonStreamingModel().withStructuredOutput(
    schema.extend({
      id: z.literal(crypto.randomUUID()).describe('节点唯一 ID'),
    }),
    {
      name: 'add_node_schema',
      method: 'jsonSchema',
    }
  )

  return model.invoke([
    new SystemMessage(`
      你是一个 AI 大屏设计器的节点生成助手。
      请根据用户要求生成一个完整的 ${materialSchema.name} 节点。
      必须遵守结构化输出 Schema。
      对于可选属性，如果用户没有明确要求，可以留空。
    `),
    getLastUserMessage(state.messages),
  ])
}

/**
 * 基于当前节点和物料 Schema 生成修改后的节点内容，并保留原有 ID 和类型
 */
async function updateNode(state, currentNode, materialSchema) {
  const zodSchema = z.fromJSONSchema(materialSchema.configSchema) as z.ZodObject

  const model = createNonStreamingModel().withStructuredOutput(zodSchema, {
    name: 'material_node',
    method: 'jsonSchema',
  })

  const res = await model.invoke([
    new SystemMessage(`
      你是一个 AI 大屏设计器的节点修改助手。
      当前选中的节点是 ${materialSchema.name}，请根据用户的要求修改该节点。
      必须遵守结构化输出 Schema。
      对于可选属性，如果用户没有明确要求，可以留空。

      当前节点的内容：

      ${JSON.stringify(currentNode, null, 2)}
    `),
    getLastUserMessage(state.messages),
  ])

  return {
    ...res,
    id: currentNode.id,
    type: currentNode.type,
  }
}
