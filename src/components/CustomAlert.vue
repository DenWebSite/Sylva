<!-- components/CustomAlert.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="custom-alert">
      <p>{{ message }}</p>
      <button @click="close" class="btn-ok">OK</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')

const show = (msg) => {
  message.value = msg
  visible.value = true
}

const close = () => {
  visible.value = false
}

defineExpose({ show })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.custom-alert {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  z-index: 1000;
  min-width: 280px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.btn-ok {
  margin-top: 16px;
  padding: 8px 24px;
  background: #000000;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-ok:hover {
  background: #858585;
}
</style>