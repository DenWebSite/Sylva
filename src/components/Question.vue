<script setup>
import { ref, computed, onMounted } from 'vue'
import Button from './Button.vue'
import { useUserStore } from '.././stores/userStore'
import router from '@/router'
import CustomAlert from '@/components/CustomAlert.vue';
const alert = ref()

const userStore = useUserStore()

const questions = ref([])
const loading = ref(true)
const error = ref(null)
const currentIndex = ref(0)
const answers = ref({})

const apiUrl = import.meta.env.VITE_API_URL

onMounted(() => {
    fetchQuestions();
})

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
}

const selectedAnswer = computed({
    get: () => answers.value[currentQuestion.value?.id] || null,
    set: (value) => {
        if (currentQuestion.value) {
            answers.value[currentQuestion.value.id] = value
            localStorage.setItem('testAnswers', JSON.stringify(answers.value))
        }
    }
})

const selectedAnswersMultiple = computed({
    get: () => {
        const currentAnswer = answers.value[currentQuestion.value?.id]
        return Array.isArray(currentAnswer) ? currentAnswer : []
    },
    set: (value) => {
        if (currentQuestion.value) {
            answers.value[currentQuestion.value.id] = value
            localStorage.setItem('testAnswers', JSON.stringify(answers.value))
        }
    }
})

const isAnswerSelected = computed(() => {
    if (!currentQuestion.value) return false

    if (currentQuestion.value.is_multiple) {
        const answer = answers.value[currentQuestion.value.id]
        return Array.isArray(answer) && answer.length > 0
    } else {
        return answers.value[currentQuestion.value.id] !== null &&
            answers.value[currentQuestion.value.id] !== undefined
    }
})

const currentQuestion = computed(() => {
    if (questions.value.length > 0 && currentIndex.value < questions.value.length) {
        return questions.value[currentIndex.value]
    }
    return null
})

const fetchQuestions = async () => {
    loading.value = true
    error.value = null

    try {
        const response = await fetch(`${apiUrl}/api/diagnostic/questions`, {
            headers: {
                'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        questions.value = data

        const savedAnswers = localStorage.getItem('testAnswers')
        if (savedAnswers) {
            answers.value = JSON.parse(savedAnswers)
        }

        currentIndex.value = 0
    } catch (err) {
        error.value = err.message
        console.error('Error fetching questions:', err)
    } finally {
        loading.value = false
    }
}

const nextQuestion = () => {
    if (isAnswerSelected.value && currentIndex.value < questions.value.length - 1) {
        currentIndex.value++;
        scrollToTop();
    } else if (isAnswerSelected.value && currentIndex.value === questions.value.length - 1) {
        submitResults()
    }
}

const prevQuestion = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--
        scrollToTop();
    }
}

const submitResults = async () => {
    try {
        const formattedAnswers = []

        for (const [questionId, answerValue] of Object.entries(answers.value)) {
            const question = questions.value.find(q => q.id === parseInt(questionId))
            if (!question) continue

            if (question.is_multiple && Array.isArray(answerValue)) {
                answerValue.forEach(answerId => {
                    if (answerId) { 
                        formattedAnswers.push({
                            questionID: parseInt(questionId),
                            answerID: parseInt(answerId)  
                        })
                    }
                })
            }
            else if (!question.is_multiple && answerValue) {
                formattedAnswers.push({
                    questionID: parseInt(questionId),
                    answerID: parseInt(answerValue)
                })
            }
        }

        const response = await fetch(`${apiUrl}/api/diagnostic/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
            },
            body: JSON.stringify({
                telegram_id: userStore.user?.id || userStore.userId(),
                answers: formattedAnswers
            })
        })

        const result = await response.json()

        if (response.ok && result.success) {
            userStore.setDiagnosticResult(result.data)
            router.push('/results')
        } else {
            console.error('Ошибка сервера:', result)
            alert.value.show('Ошибка сервера: ', result)
        }
    } catch (err) {
        console.error('Ошибка при отправке:', err)
        alert.value.show('Ошибка соединения. Проверьте подключение к серверу.')
        const errorData = await response.json()
        console.error('Детали ошибки сервера:', errorData)
        throw new Error(`Server error: ${response.status}`)
    }
}
</script>

<template>
    <CustomAlert ref="alert" />
    <div class="question-container">
        <div v-if="loading" class="loading">
            Загрузка вопросов...
        </div>

        <div v-else-if="error" class="error">
            Ошибка: {{ error }}
        </div>

        <div v-else-if="questions.length > 0">
            <h3 class="question-title"><span>{{ currentIndex + 1 }}.</span> {{ currentQuestion.text }}</h3>

            <div class="answers-list">
                <label v-for="answer in currentQuestion.answers" :key="answer.id" class="answer-item"
                    v-if="!currentQuestion.is_multiple">
                    <input type="radio" :name="`question_${currentQuestion.id}`" :value="answer.id"
                        v-model="selectedAnswer" />
                    <span class="custom-radio"></span>
                    <span class="answer-text">{{ answer.text }}</span>
                </label>

                <label v-for="answer in currentQuestion.answers" :key="answer.id" class="answer-item"
                    v-if="currentQuestion.is_multiple">
                    <input type="checkbox" :name="`question_${currentQuestion.id}`" :value="answer.id"
                        v-model="selectedAnswersMultiple" />
                    <span class="custom-checkbox"></span>
                    <span class="answer-text">{{ answer.text }}</span>
                </label>
            </div>
        </div>

        <p class="question-footer"><span>Sylva</span> — результат здесь и сейчас. каждый день.</p>
    </div>
    <div class="navigation">
        <Button @click="nextQuestion"
            :btnTitle="currentIndex === questions.length - 1 ? 'Подвести итоги' : 'Следующий вопрос'" />

        <Button @click="prevQuestion" btnTitle="Предыдущий вопрос" v-show="currentIndex !== 0" />
    </div>
</template>

<style scoped>
.answers-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.answer-item {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    position: relative;
}

.answer-item input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.custom-radio {
    display: flex;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #ccc;
    background-color: #fff;
    transition: all 0.2s ease;
    position: relative;
    flex-shrink: 0;
}

.answer-item input:checked+.custom-radio {
    border-color: #000;
    background-color: #fff;
}

.answer-item input:checked+.custom-radio::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #000;
}

.answer-item:hover .custom-radio {
    border-color: #666;
}

.custom-checkbox {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 2px solid #ccc;
    background-color: #fff;
    transition: all 0.2s ease;
    position: relative;
    flex-shrink: 0;
}

.answer-item input:checked+.custom-checkbox {
    border-color: #000;
    background-color: #000;
}

.answer-item input:checked+.custom-checkbox::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.answer-item:hover .custom-checkbox {
    border-color: #666;
}

.question-container {
    border: 1px solid var(--color-black);
    background-color: var(--color-light-gray);
    padding: 25px 15px;
    border-radius: 30px;
    height: 500px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.question-title {
    font-family: var(--font-amazing);
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 30px;

    span {
        font-family: var(--font-inter);
    }
}

.answers-list {
    display: flex;
    flex-direction: column;
    gap: 11px;
    font-size: 17px;
}

.question-footer {
    font-size: 16px;
    opacity: 0.3;
    font-weight: 500;
    text-align: center;
    max-width: 300px;
    margin: 0 auto;
    line-height: 100%;

    span {
        font-family: var(--font-amazing);
    }
}

.navigation {
    display: flex;
    flex-direction: column;
    position: relative;
    bottom: -30px;

    button {
        margin-bottom: 20px;
    }
}
</style>