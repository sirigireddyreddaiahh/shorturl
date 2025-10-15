<script setup lang="ts" generic="U extends ZodAny">
import type { ZodAny } from 'zod'
import { computed } from 'vue'
import type { Config, ConfigItem, Shape } from './interface'
import { DEFAULT_ZOD_HANDLERS, INPUT_COMPONENTS } from './constant'
import useDependencies from './dependencies'

const props = defineProps<{
  fieldName: string
  shape: Shape
  config?: ConfigItem | Config<U>
}>()

function isValidConfig(config: any): config is ConfigItem {
  return !!config?.component
}

const delegatedProps = computed(() => {
  if (['ZodObject', 'ZodArray'].includes(props.shape?.type as string))
    return { schema: props.shape?.schema }
  return undefined
})

const { isDisabled, isHidden, isRequired, overrideOptions } = useDependencies(props.fieldName)

// Compute the component to render so template expressions are simple and
// avoid index-access on possibly undefined values.
const selectedComponent = computed(() => {
  if (isValidConfig(props.config)) {
    return typeof props.config.component === 'string'
      ? INPUT_COMPONENTS[props.config.component as keyof typeof INPUT_COMPONENTS]
      : props.config.component
  }

  const handlerKey = (props.shape?.type ?? '') as keyof typeof DEFAULT_ZOD_HANDLERS
  const mapped = DEFAULT_ZOD_HANDLERS[handlerKey]
  return INPUT_COMPONENTS[mapped as keyof typeof INPUT_COMPONENTS]
})
</script>

<template>
  <component
    :is="selectedComponent"
    v-if="!isHidden"
    :field-name="fieldName"
    :label="shape.schema?.description"
    :required="isRequired || shape.required"
    :options="overrideOptions || shape.options"
    :disabled="isDisabled"
    :config="config"
    v-bind="delegatedProps"
  >
    <slot />
  </component>
</template>
