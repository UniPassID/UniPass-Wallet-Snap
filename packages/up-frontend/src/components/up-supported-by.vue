<template>
  <div class="up-supported-by">
    <span>Supported by</span>
    <img class="unipass-logo" src="@/assets/img/UniPass.svg" />
    <span class="text">UniPass</span>
  </div>
</template>

<style lang="scss">
.up-supported-by {
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  bottom: 40px;

  font-weight: 450;
  font-size: 12px;
  line-height: 20px;
  color: var(--up-text-secondary);

  display: none;
  align-items: center;
  justify-content: center;

  .unipass-logo {
    width: 20px;
    height: 20px;
    margin: 0 8px;
  }
  .text {
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    color: var(--up-text-primary);
  }
}
</style>
