<template>
  <el-dialog
    class="up-confirm"
    v-bind="$attrs"
    center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <template v-for="(index, name) in $slots" #[name]><slot :name="name" /></template>
  </el-dialog>
</template>

<script setup lang="ts">
//
</script>

<style lang="scss">
html {
  .el-dialog.up-confirm {
    padding: 24px;
    border-radius: 20px;
    .el-dialog__header {
      .el-dialog__title {
        font-weight: 600;
        font-size: 20px;
        line-height: 28px;
      }
    }
    .el-dialog__body {
      padding: 0;
      .el-form {
        margin-top: 28px;
      }
      .up-button {
        margin-top: 20px;
      }
    }
    .el-dialog__footer {
      margin-top: 20px;
      padding: 0;
    }

    .el-dialog__subtitle {
      margin-top: 14px;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      word-break: break-word;
    }
  }
}
</style>
