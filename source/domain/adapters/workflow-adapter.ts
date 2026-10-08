/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain adapters                                                     ║
║ Dictionary serialization for workflow topic abstractions.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to workflow abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
TaskAdapter          Deserialize/Serialize Task.
TaskQuestionAdapter  Deserialize/Serialize TaskQuestion.
WorkflowAdapter      Deserialize/Serialize Workflow.
WorkflowTaskAdapter  Deserialize/Serialize WorkflowTask.
SelectOptionAdapter  Deserialize/Serialize SelectOption.
QuestionAdapter      Deserialize/Serialize Question.
AnswerAdapter        Deserialize/Serialize Answer.
*/

import { InstantiableAdapt, makeAdapter } from '@core/stdx'
import type {
  Answer,
  Question,
  SelectOption,
  Task,
  TaskQuestion,
  Workflow,
  WorkflowTask
} from '@domain/abstractions/workflow.ts'
import { NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize Task. */
export const TaskAdapter = makeAdapter<Task>({
  ...InstantiableAdapt,
  notes: ['notes', NoteAdapter],
  label: ['label'],
  description: ['description']
})

/** Deserialize/Serialize TaskQuestion. */
export const TaskQuestionAdapter = makeAdapter<TaskQuestion>({
  taskId: ['task_id'],
  questionId: ['question_id'],
  sequence: ['sequence']
})

/** Deserialize/Serialize Workflow. */
export const WorkflowAdapter = makeAdapter<Workflow>({
  ...InstantiableAdapt,
  notes: ['notes', NoteAdapter],
  name: ['name'],
  description: ['description'],
  version: ['version'],
  facets: ['facets']
})

/** Deserialize/Serialize WorkflowTask. */
export const WorkflowTaskAdapter = makeAdapter<WorkflowTask>({
  workflowId: ['workflow_id'],
  taskId: ['task_id'],
  sequence: ['sequence']
})

/** Deserialize/Serialize SelectOption. */
export const SelectOptionAdapter = makeAdapter<SelectOption>({
  value: ['value'],
  label: ['label'],
  requiresNote: ['requires_note']
})

/** Deserialize/Serialize Question. */
export const QuestionAdapter = makeAdapter<Question>({
  ...InstantiableAdapt,
  type: ['type'],
  prompt: ['prompt'],
  helpText: ['help_text'],
  required: ['required'],
  options: ['options', SelectOptionAdapter]
})

/** Deserialize/Serialize Answer. */
export const AnswerAdapter = makeAdapter<Answer>({
  questionId: ['question_id'],
  notes: ['notes', NoteAdapter],
  value: ['value'],
  capturedAt: ['captured_at']
})
