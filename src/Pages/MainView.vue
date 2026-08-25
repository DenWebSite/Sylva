<script setup>
import Button from '@/components/Button.vue';
import { ref } from 'vue'
import { RouterLink } from 'vue-router';
import { useUserStore } from '.././stores/userStore'

const userStore = useUserStore();

const course_id = userStore.course;
</script>

<template>
    <div class="container gray">
        <p class="name">Sylva</p>
        <img class="hero__image" src="/hero-image.jpg" alt="image" width="430" height="573">

        <h1 class="hero__title">Твоя кожа говорит — <br> Мы переводим</h1>
        <p class="hero__subtitle">Уход — это не про случайный выбор.</p>
        <p class="hero__subtitle">Это про точное попадание в состояние кожи сегодня.</p>

        <div class="buttons">
            <RouterLink to="/course" v-if="course_id">
                <Button btnTitle="К курсу"></Button>
            </RouterLink>

            <RouterLink to="/secondpage" v-else>
                <Button btnTitle="Начать диагностику"></Button>
            </RouterLink>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.name {
    text-align: center;
    font-size: 20px;
    margin-bottom: 10px;
    font-family: var(--font-amazing);
}

.hero {

    &__title {
        font-family: var(--font-amazing), sans-serif;
        font-weight: 700;
        font-size: 32px;
        letter-spacing: -3%;
        align-items: center;
        text-align: center;
        margin-block: 10px;
        line-height: 100%;
    }

    &__subtitle {
        font-size: 16px;
        text-align: center;
        line-height: 95%;


        &+& {
            margin-bottom: 30px;
        }
    }
}

.buttons {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
</style>
