<template>
  <el-dialog v-bind="$attrs" center :show-close="false">
    <template v-for="(index, name) in $slots" #[name]><slot :name="name" /></template>
  </el-dialog>
</template>
