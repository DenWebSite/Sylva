<template>
    <div class="container">
        <div class="results-container">
            <div v-if="loading" class="loading">
                Загрузка...
            </div>

            <div v-else-if="result" class="results__content">
                <h1 class="title">Мы нашли твой идеальный уход</h1>
                <p class="subtitle">Основано на состоянии кожи прямо сейчас</p>

                <div class="results__box" :style="{ backgroundColor: getProductBackgroundColor }">
                    <h2>{{ result.product?.name }}</h2>
                    <p>{{ result.product?.description }}</p>
                    <img :src=imgPath alt="">

                    <p>{{ result.product?.description_2 }}</p>
                </div>

                <div class="results__guide">
                    <h2 class="results__guide-title">Как пользоваться флюидом?</h2>

                    <div class="results__guide-item" v-for="(task, index) in tasksArray" :key="index">
                        <p class="results__guide-number">0{{ index + 1 }}</p>
                        <p class="results__guide-descr">{{ task }}</p>
                    </div>
                </div>

                <div class="effect">
                    <img src="/result-2.jpg" alt="image">
                    <div class="effect__inner">
                        <h3 class="effect__title">Эффект через <span>21</span> день:</h3>
                        <ul class="effect__list">
                            <li class="effect__list-item" v-for="effect in effectArray">{{ effect }}</li>
                        </ul>

                        <p class="effect__text">Sylva — когда нужен эффект</p>
                    </div>
                </div>

                <div class="buttons">
                    <a :href="result.product?.marketplace_wb_url" target="_blank" rel="noopener noreferrer">
                        <Button btnTitle="Купить на Wildberries" />
                    </a>
                    <a :href="result.product?.marketplace_ozon_url" target="_blank" rel="noopener noreferrer">
                        <Button class="white" btnTitle="Купить на Ozon" />
                    </a>

                    <RouterLink to="/course" v-if="!course_id" @click="createCourse()">
                        <Button btnTitle="Я уже купил → активировать уход"
                            :style="{ backgroundColor: getProductBackgroundColor }" />
                    </RouterLink>

                    <RouterLink to="/course" v-else>
                        <Button btnTitle="Перейти к курсу" :style="{ backgroundColor: getProductBackgroundColor }" />
                    </RouterLink>
                </div>
            </div>

            <div v-else class="error">
                Не удалось загрузить результаты
            </div>
        </div>
    </div>
    <CustomAlert ref="alert" />
</template>

<script setup>
import CustomAlert from '@/components/CustomAlert.vue';
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import Button from '@/components/Button.vue';

const alert = ref()

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const result = ref(null)

loading.value = false;

let course_id = userStore.course;

const apiUrl = import.meta.env.VITE_API_URL

const tasksArray = computed(() => {
    if (!result.value?.product?.course_tasks) return []
    return result.value.product.course_tasks.split(/\r?\n/).filter(t => t?.trim())
})

const effectArray = computed(() => {
    if (!result.value?.product?.course_effect) return []
    return result.value.product.course_effect.split(/\r?\n/).filter(e => e?.trim())
})

onMounted(() => {
    result.value = userStore.getDiagnosticResult()
    loading.value = false
})

const createCourse = async () => {
    if (!userStore.diagnosticResult?.session_id) {
        console.error('Нет session_id')
        alert.value.show('Ошибка: не найден ID сессии')

        return
    }

    try {
        const response = await fetch(`${apiUrl}/api/course/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
            },
            body: JSON.stringify({
                session_id: userStore.diagnosticResult.session_id
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const resultData = await response.json()
        userStore.setCourse(resultData.data.CourseID)

        router.push('/course')

    } catch (error) {
        console.error('Ошибка создания курса:', error)
        alert.value.show('Не удалось активировать курс. Попробуйте позже.')
    }
}

const getProductBackgroundColor = computed(() => {
    const productName = result.value?.product?.name

    if (!productName) return '#9CBF6E'

    if (productName.includes('Глубокое') || productName === 'Флюид Глубокое увлажнение') {
        return '#9CBF6E'
    } else if (productName.includes('Интенсивное') || productName === 'Флюид Интенсивное питание') {
        return '#92C8E1'
    } else if (productName.includes('Витаминный') || productName === 'Флюид Витаминный бустер') {
        return '#F1CE7E'
    }
    return '#9CBF6E'
})

const imgPath = computed(() => {
    const productName = result.value?.product?.name

    if (!productName) return '/fluid-3.jpg'

    if (productName.includes('Глубокое') || productName === 'Флюид Глубокое увлажнение') {
        return '/fluid.jpg'
    } else if (productName.includes('Интенсивное') || productName === 'Флюид Интенсивное питание') {
        return '/fluid-2.jpg'
    } else if (productName.includes('Витаминный') || productName === 'Флюид Витаминный бустер') {
        return '/fluid-3.jpg'
    }
    return '/fluid.jpg'
})
</script>


<style lang="scss" scoped>
.effect {
    margin-top: 30px;
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;

    &__inner {
        height: 270px;
        border: 1px solid var(--color-black);
        border-radius: 30px;
        padding: 10px;
    }

    &__title {
        font-family: var(--font-amazing);
        font-weight: 700;
        line-height: 100%;
        margin-block: 20px;

        span {
            font-family: var(--font-inter);
        }
    }

    &__list {
        font-size: 15px;

        &-item {
            line-height: 100%;
        }
    }

    &__text {
        font-size: 15px;
        font-weight: 500;
        line-height: 100%;
        position: absolute;
        bottom: 20px;
    }

    img {
        width: 210px;
        height: 270px;
    }
}

@media (max-width: 420px) {

    .effect {
        display: flex;
        flex-direction: column;

        &__inner {
            width: 100%;
            text-align: center;
            min-height: 140px;
        }

        &__text {
            width: 100%;
            left: 50%;
            transform: translateX(-50%);
        }

        img {
            width: 100%;
            max-height: 234px;
            object-fit: cover;
        }
    }
}

.buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 30px;
}

.white {
    background-color: #FFF;
    color: var(--color-black);
    border: 1px solid #C7C7C7;
}

.title {
    font-size: 36px;
    font-weight: 700;
    font-family: var(--font-amazing);
    margin-block: 30px 6px;
}

.results {

    &__guide {
        margin-bottom: 30px;

        &-title {
            font-family: var(--font-amazing);
            font-size: 18px;
            font-weight: 700;
            margin-top: 25px;
            margin-bottom: 44px;
            text-align: center;
        }

        &-item {
            margin: 0 auto;
            display: grid;
            grid-template-columns: 30% 70%;
            align-items: center;
            justify-content: center;
            justify-items: start;
            gap: 14px;
            line-height: 100%;
            max-width: 340px;
            padding-top: 20px;

            &+& {
                margin-top: 20px;
                border-top: 1px solid rgba($color: #000000, $alpha: 0.1);
            }
        }

        &-number {
            font-family: var(--font-mokoko);
            font-size: 64px;
            font-weight: 500;
            opacity: 8%;
        }
    }
}

.results__box {
    margin-top: 26px;
    padding: 25px 13px;
    border-radius: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: #fff;

    h2 {
        font-family: var(--font-amazing);
        font-size: 24px;
        font-weight: 700;
    }

    p {
        text-align: center;
        margin-block: 10px 15px;
    }
}
</style>