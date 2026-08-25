<script setup>
import Button from '@/components/Button.vue';
import { RouterLink } from 'vue-router';
import { onMounted, ref } from 'vue';

const isPageReady = ref(false)

onMounted(async () => {
    await document.fonts.ready

    setTimeout(() => {
        isPageReady.value = true;
    }, 500)
})
</script>

<template>
    <div class="container" v-show="isPageReady">
        <div v-if="!isPageReady" class="loading">
            Загрузка...
        </div>

        <div v-else>
            <h1 class="hero__title">
                <span class="hero__title-number">21</span>
                <span class="hero__title-span">день, который меняет кожу</span>
            </h1>
            <p class="hero__subtitle">Мы не просто подбираем средство — мы сопровождаем тебя до <span>результата.
                </span>
            </p>
            <p class="hero__subtitle">Каждый флюид — <span>это система</span>: увлажнение, восстановление или сияние.
            </p>

            <img class="hero__image" src="/redhead-girl.jpg" alt="image" width="430" height="573">

            <RouterLink to="/question">
                <Button btnTitle="Пройти диагностику"></Button>
            </RouterLink>

        </div>
    </div>
</template>

<style lang="scss" scoped>
.hero {
    &__image {
        margin-bottom: 30px;
    }

    &__title {
        font-weight: 700;
        font-size: 36px;
        align-items: center;
        margin-block: 0 14px;
        line-height: 100%;

        &-number {
            margin-right: 8px;
        }

        &-span {
            font-family: var(--font-amazing);
            letter-spacing: -3%;
        }
    }

    &__subtitle {
        font-size: 16px;
        line-height: 95%;
        margin-bottom: 10px;
        position: relative;

        span {
            font-weight: 700;
        }
    }
}
</style>
