<script setup>
import { watch } from 'vue';
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '.././stores/userStore'
import Button from './../components/Button.vue'
import CustomAlert from '@/components/CustomAlert.vue';

const alert = ref()

const userStore = useUserStore();
const router = useRouter();

const days = ref([]);
const progressBar = ref(0);
const selectedOptions = ref([])
const isFormValid = ref(false);
const selectedDay = ref();
const isAnimated = ref(false)

const apiUrl = import.meta.env.VITE_API_URL

const loadCourseData = async () => {
    if (!userStore.course) {
        return false
    }

    try {
        await Promise.all([
            getCourseDays(),
            getCourseProgress()
        ])
        return true
    } catch (error) {
        console.error('Ошибка загрузки данных курса:', error)
        return false
    }
}

onMounted(async () => {
    if (!userStore.course) {
        const savedCourse = localStorage.getItem('user_course')
        if (savedCourse) {
            userStore.setCourse(savedCourse)
        }
    }

    if (userStore.course) {
        await Promise.all([
            getCourseDays(),
            getCourseProgress()
        ])
    }

    setTimeout(() => {
        isAnimated.value = true
    }, 200)
})

onUnmounted(() => {
    if (window.Telegram?.WebApp && window.Telegram.WebApp.BackButton) {
        window.Telegram.WebApp.BackButton.hide()
    }
})

const getCourseDays = async () => {

    const telegram_id = userStore.user?.id || userStore.userId?.value
    let course_id = userStore.course;

    if (!course_id) {
        course_id = localStorage.getItem('user_course');
        if (course_id) {
            userStore.setCourse(course_id);
        }
    }

    if (!course_id) {
        console.error('❌ Нет course_id в getCourseDays');
        return null;
    }


    try {
        const url = `${apiUrl}/api/course/calendar?telegram_id=${telegram_id}&course_id=${course_id}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Content-type": 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Текст ошибки:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        days.value = data.data || data;

        if (days.value.length > 0) {
            const firstIncompleteDay = days.value.find(day => !day.completed)
            selectedDay.value = firstIncompleteDay || days.value[0]
        }

        return days.value;

    } catch (error) {
        console.error('❌ Ошибка getCourseDays:', error.message);
        return null;
    }
}

const getCourseProgress = async () => {
    const telegram_id = userStore.user?.id || userStore.userId?.value
    const course_id = userStore.course;

    if (!course_id) {
        return null;
    }

    try {
        const url = `${apiUrl}/api/course/user/progress?telegram_id=${telegram_id}&course_id=${course_id}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Content-type": 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Текст ошибки:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        progressBar.value = data.data || data;
        return progressBar.value;

    } catch (error) {
        console.error('❌ Ошибка getCourseProgress:', error.message);
        return null;
    }
}

const setSelectedDay = (day) => {
    selectedDay.value = day;
}

const setDayComplete = async (day) => {
    if (selectedOptions.value.length !== 3) {
        return;
    }

    let course_id = userStore.course;
    if (!course_id) {
        course_id = localStorage.getItem('user_course');
        if (course_id) {
            userStore.setCourse(course_id);
        }
    }

    if (!course_id) {
        alert.value.show('Курс не найден. Пожалуйста, обновите страницу.')
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/api/course/day/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
            },
            body: JSON.stringify({
                telegram_id: userStore.user?.id || userStore.userId(),
                day_number: day,
                course_id: parseInt(course_id),
            })
        })

        const result = await response.json()

        if (response.ok) {
            const currentCompletedDay = day;

            await getCourseDays();
            await getCourseProgress();
            await checkIsCourseComplete();

            const nextIncompleteDay = days.value.find(d => !d.completed);
            if (nextIncompleteDay) {
                selectedDay.value = nextIncompleteDay;
            } else {
                selectedDay.value = days.value[days.value.length - 1];
            }

            selectedOptions.value = [];

            const prevDayNumber = selectedDay.value.day_number - 1
            const prevDay = days.value.find(d => d.day_number === prevDayNumber)
            alert.value.show(prevDay?.description || "Ты молодец!")

        } else if (response.status == 423) {
            alert.value.show('Вы сможете завершить этот день позже')
        } else {
            alert.value.show('Ошибка: ' + (result.message || 'Не удалось завершить день'))
        }

    } catch (err) {
        console.error('Ошибка при отправке:', err)
        alert.value.show('Ошибка соединения. Проверьте подключение к серверу.')
    }
}

const checkIsCourseComplete = async () => {
    const telegram_id = userStore.user?.id;
    const course_id = userStore.course;

    if (!course_id) {
        return null;
    }

    try {
        const url = `${apiUrl}/api/course/complete?telegram_id=${telegram_id}&course_id=${course_id}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Content-type": 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Текст ошибки:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        const isComplete = data.data === true || data.is_complete === true || data === true;

        return isComplete;

    } catch (error) {
        console.error('❌ Ошибка checkIsCourseComplete:', error.message);
        return null;
    }
}

watch(() => userStore.course, async (newCourse, oldCourse) => {
    if (newCourse && newCourse !== oldCourse) {
        await getCourseDays()
        await getCourseProgress()
    }
})

watch(selectedOptions, (newValue) => {
    isFormValid.value = newValue.length === 3;
}, { deep: true });
</script>
<template>
    <CustomAlert ref="alert" />
    <div class="container gray">
        <h1 class="title">
            Начинаем трансформацию кожи
            и бережный уход за ней
        </h1>

        <RouterLink to="/results">
            <svg class="title-svg" :class="{ 'animate-bounce': isAnimated }" width="29" height="29" viewBox="0 0 29 29"
                fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_1619_2)">
                    <path
                        d="M11.7812 4.53125H17.2187M17.4495 6.00542C17.2983 5.73514 17.2188 5.43063 17.2187 5.12092V1.8125C17.2187 1.57215 17.1233 1.34164 16.9533 1.17168C16.7833 1.00173 16.5528 0.90625 16.3125 0.90625H12.6875C12.4471 0.90625 12.2166 1.00173 12.0467 1.17168C11.8767 1.34164 11.7812 1.57215 11.7812 1.8125V5.12092C11.7811 5.43063 11.7017 5.73514 11.5504 6.00542L9.60624 9.48179C8.65977 10.9845 8.15713 12.7241 8.15624 14.5V25.7774C8.15174 26.1819 8.28455 26.5761 8.53299 26.8954C8.78143 27.2147 9.13082 27.4404 9.52407 27.5355C12.7987 28.2798 16.2001 28.2798 19.4759 27.5355C19.8692 27.4404 20.2185 27.2147 20.467 26.8954C20.7154 26.5761 20.8482 26.1819 20.8437 25.7774V14.5C20.8437 12.7238 20.3411 10.9838 19.3937 9.48179L17.4495 6.00542Z"
                        stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <defs>
                    <clipPath id="clip0_1619_2">
                        <rect width="29" height="29" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        </RouterLink>

        <p class="subtitle">
            21 день — это цикл обновления кожи.
            Следуй протоколу, чтобы увидеть результат.
        </p>

        <div class="days">
            <div v-for="day in days" class="day" @click="setSelectedDay(day)"
                :style="!day.completed && day.id !== 1 ? { border: '1px solid #000' } : { border: '1px solid #FFF' }">
                <svg v-if="day.id === 1 || day.completed" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.3">
                        <path
                            d="M7 10.0001H20C20.2652 10.0001 20.5196 10.1054 20.7071 10.293C20.8946 10.4805 21 10.7349 21 11.0001V21.0001C21 21.2653 20.8946 21.5197 20.7071 21.7072C20.5196 21.8947 20.2652 22.0001 20 22.0001H4C3.73478 22.0001 3.48043 21.8947 3.29289 21.7072C3.10536 21.5197 3 21.2653 3 21.0001V11.0001C3 10.7349 3.10536 10.4805 3.29289 10.293C3.48043 10.1054 3.73478 10.0001 4 10.0001H5V9.00009C4.99943 7.42279 5.53158 5.89153 6.51019 4.65452C7.4888 3.41752 8.8565 2.54727 10.3916 2.18485C11.9267 1.82243 13.5392 1.98909 14.9677 2.6578C16.3963 3.32651 17.5571 4.45809 18.262 5.86909L16.473 6.76309C15.9695 5.75511 15.1403 4.94674 14.1198 4.46904C13.0994 3.99134 11.9475 3.87232 10.8509 4.13127C9.7543 4.39022 8.77733 5.01196 8.07836 5.8957C7.37939 6.77943 6.9994 7.87335 7 9.00009V10.0001ZM5 12.0001V20.0001H19V12.0001H5ZM10 15.0001H14V17.0001H10V15.0001Z"
                            fill="black" />
                    </g>
                </svg>

                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M19 10H20C20.2652 10 20.5196 10.1054 20.7071 10.2929C20.8946 10.4804 21 10.7348 21 11V21C21 21.2652 20.8946 21.5196 20.7071 21.7071C20.5196 21.8946 20.2652 22 20 22H4C3.73478 22 3.48043 21.8946 3.29289 21.7071C3.10536 21.5196 3 21.2652 3 21V11C3 10.7348 3.10536 10.4804 3.29289 10.2929C3.48043 10.1054 3.73478 10 4 10H5V9C5 7.14348 5.7375 5.36301 7.05025 4.05025C8.36301 2.7375 10.1435 2 12 2C13.8565 2 15.637 2.7375 16.9497 4.05025C18.2625 5.36301 19 7.14348 19 9V10ZM5 12V20H19V12H5ZM11 14H13V18H11V14ZM17 10V9C17 7.67392 16.4732 6.40215 15.5355 5.46447C14.5979 4.52678 13.3261 4 12 4C10.6739 4 9.40215 4.52678 8.46447 5.46447C7.52678 6.40215 7 7.67392 7 9V10H17Z"
                        fill="black" />
                </svg>
                <p>{{ day.day_number }} День</p>
            </div>
        </div>

        <div class="progress__bar">
            <span :style="{ width: `${progressBar}%` }" class="progress__bar-item"></span>
        </div>

        <div v-if="progressBar !== 100" class="descr">
            <div class="descr__inner" v-if="selectedDay">
                <h2 class="descr__title">
                    <span>{{ selectedDay.day_number }}</span> день. <br> {{ selectedDay.title }}
                </h2>

                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" value="option1" v-model="selectedOptions" />
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-text">Очистить лицо</span>
                    </label>

                    <label class="checkbox-label">
                        <input type="checkbox" value="option2" v-model="selectedOptions" />
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-text">Сделать крио-уход с флюидом (утром и вечером)</span>
                    </label>

                    <label class="checkbox-label">
                        <input type="checkbox" value="option3" v-model="selectedOptions" />
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-text">Зафиксировать результат кремом</span>
                    </label>
                </div>
            </div>

            <div class="descr__inner" v-else>
                <h2 class="descr__title">Выберите день курса</h2>
            </div>

            <Button class="button" btnTitle="Отправить" @click="setDayComplete(selectedDay.day_number)"
                :disabled="!isFormValid || selectedDay.completed">
            </Button>

            <img class="descr__image" src="/day.jpg" alt="">
        </div>

        <div class="course__complete" v-else>
            <p class="title">Вы молодец!</p>
            <p>Вы прошли этот 21-дневний курс, это очень круто!</p>
            <p>Теперь вы, при желании, можете оценить данный курс и рассказать нам о своих результатах</p>

            <RouterLink to="/review">
                <Button btnTitle="Оценить курс"></Button>
            </RouterLink>
        </div>

    </div>

</template>

<style lang="scss" scoped>
.container {
    position: relative;
}

.button {
    margin-top: 15px;
    margin-bottom: 15px;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

}

.title {
    font-size: 36px;
    font-weight: 700;
    margin-block: 0 6px;
    line-height: 100%;
    font-family: var(--font-amazing);

    &-svg {
        position: absolute;
        right: 0;
        top: 22px;
        cursor: pointer;
    }
}

.subtitle {
    line-height: 110%;
}

.days {
    margin-top: 15px;
    margin-bottom: 15px;
    padding-block: 15px 25px;
    border-top: 1px solid rgba(0, 0, 0, 1);
    gap: 10px;
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
}

.day {
    background-color: #FFF;
    padding: 4px;
    flex-shrink: 0;
    width: 64px;
    height: 77px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 50px;
    font-size: 13px;
}

.progress__bar {
    max-width: 430px;
    width: 100%;
    height: 20px;
    background-color: rgba(217, 217, 217, 1);
    border-radius: 50px;

    &-item {
        background-color: #000;
        display: block;
        height: 20px;
        min-width: 20px;
        border-radius: 50px;
    }
}

.descr {

    &__title {
        font-family: var(--font-amazing);
        font-size: 28px;
        font-weight: 700;
        margin-top: 30px;
        margin-bottom: 10px;
        line-height: 104%;

        span {
            font-family: var(--font-inter);
        }
    }

    &__subtitle {
        line-height: 100%;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 20px;
        font-family: var(--font-amazing);
    }
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 8px;
    cursor: pointer;

    input {
        display: none;
    }

    .checkbox-custom {
        width: 20px;
        height: 20px;
        min-width: 20px;
        min-height: 20px;
        border-radius: 4px;
        background-color: #e0e0e0;
        transition: all 0.2s;
        position: relative;
        flex-shrink: 0;
    }

    input:checked+.checkbox-custom {
        background-color: #000;

        &::after {
            content: '';
            position: absolute;
            left: 7px;
            top: 3px;
            width: 6px;
            height: 10px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
    }

    .checkbox-text {
        font-size: 17px;
    }
}

.course__complete {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 430px;
    width: 100%;
    gap: 20px;
    text-align: center;
    margin-top: 50px;

    a {
        width: 100%;
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }

    75% {
        transform: translateY(3px);
    }
}

.animate-bounce {
    animation: bounce 0.8s ease 3;
}
</style>