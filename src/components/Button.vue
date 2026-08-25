<script setup>
const props = defineProps({
    btnTitle: {
        type: String,
        default: 'Кнопка'
    }
});
</script>

<template>
    <button class="btn">
        {{ btnTitle }}
    </button>
</template>

<style scoped>

.btn{
    font-family: var(--font-amazing);
    font-size: 20px;
    font-weight: 500;
    text-align: center;
    background-color: black;
    color: aliceblue;
    border: none;
    border-radius: 50px;
    padding: 25px;
    max-width: 430px;
    width: 100%;
    min-height: 70px;
    cursor: pointer;
}

</style>