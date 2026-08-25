<script setup>
import { ref } from 'vue'
import Button from './../components/Button.vue'
import { useUserStore } from '.././stores/userStore'
import CustomAlert from '@/components/CustomAlert.vue';

const alert = ref()
const fileInput = ref(null)

const userStore = useUserStore()

const reviewText = ref('')
const mediaFiles = ref([])
const hoverRating = ref(0)
const rating = ref(0)

const isCongratulationsVisible = ref(false);

const apiUrl = import.meta.env.VITE_API_URL

const handleFileUpload = (event) => {
    if (mediaFiles.value.length >= 1) {
        alert.value.show('Можно загрузить только одно фото')
        if (fileInput.value) {
            fileInput.value.value = ''
        }
        return
    }

    const files = Array.from(event.target.files)
    files.forEach(file => {
        const preview = URL.createObjectURL(file)
        mediaFiles.value.push({
            file: file,
            preview: preview,
            type: file.type
        })
    })

    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

const removeFile = (index) => {
    URL.revokeObjectURL(mediaFiles.value[index].preview)
    mediaFiles.value.splice(index, 1)
}

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)
    })
}

const submitReview = async () => {
    if (rating.value === 0) {
        alert.value.show('Пожалуйста, оцените курс (1-5 звезд)')
        return
    }

    if (!reviewText.value.trim()) {
        alert.value.show('Пожалуйста, напишите отзыв')
        return
    }

    try {
        let photoBase64 = ""
        if (mediaFiles.value.length > 0) {
            photoBase64 = await fileToBase64(mediaFiles.value[0].file)
        }

        const response = await fetch(`${apiUrl}/api/review/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
            },
            body: JSON.stringify({
                telegram_id: userStore.user?.id || userStore.userId?.value,
                rating: rating.value,
                comment: reviewText.value,
                photo_url: photoBase64
            })
        })

        if (response.ok) {
            isCongratulationsVisible.value = true;
            rating.value = 0
            reviewText.value = ''
            mediaFiles.value = []
            userStore.clearCourse();
        } else {
            const error = await response.json()
            alert.value.show('Ошибка: ' + (error.message || 'Не удалось отправить отзыв'))
        }
    } catch (error) {
        console.error('Ошибка:', error)
        alert.value.show('Ошибка соединения. Проверьте подключение к серверу.')
    }
}


const getStarColor = (starNumber) => {
    const isActive = starNumber <= (hoverRating.value || rating.value)
    return isActive ? '#FFDA53' : '#D9D9D9'
}

const setRating = (star) => {
    rating.value = star
}
</script>

<template>
    <CustomAlert ref="alert" />
    <div class="container gray">
        <p class="under-title">Sylva</p>
        <div v-if="!isCongratulationsVisible" class="review__main">
            <h1 class="title">Гордимся тобой!</h1>
            <p class="subtitle">Оцени курс и поделись результатом, а также продолжи уход <a>новыми средствами</a> из
                нашей
                коллекции</p>

            <div class="stars">
                <button v-for="star in 5" :key="star" class="star-btn" @click="setRating(star)"
                    @mouseenter="hoverRating = star" @mouseleave="hoverRating = 0">
                    <svg :fill="getStarColor(star)" :stroke="getStarColor(star)" width="74" height="70"
                        viewBox="0 0 74 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M34.7853 1.37521C35.3881 -0.458655 37.9823 -0.458661 38.5852 1.37521L45.8872 23.5871C46.157 24.4078 46.9233 24.9625 47.7872 24.9625H71.3667C73.3098 24.9625 74.1116 27.4536 72.5332 28.587L53.4974 42.2565C52.7882 42.7658 52.4914 43.6762 52.764 44.5057L60.0445 66.6522C60.6489 68.4907 58.55 70.0302 56.978 68.9014L37.8518 55.167C37.1547 54.6664 36.2158 54.6663 35.5187 55.167L16.3925 68.9014C14.8205 70.0302 12.7216 68.4907 13.326 66.6522L20.6065 44.5057C20.8791 43.6762 20.5823 42.7658 19.8731 42.2565L0.837245 28.587C-0.741078 27.4536 0.0607128 24.9625 2.00382 24.9625H25.5833C26.4472 24.9625 27.2135 24.4078 27.4833 23.5871L34.7853 1.37521Z" />
                    </svg>
                </button>
            </div>

            <p class="review-text">Расскажи как изменилась твоя кожа после 21-дневного курса?</p>

            <div class="review-input-wrapper">
                <textarea v-model="reviewText" class="review-textarea" placeholder="Оставить отзыв..."
                    rows="4"></textarea>
            </div>

            <div class="media-upload">
                <label class="upload-label">
                    <input ref="fileInput" type="file" accept="image/*,video/*" @change="handleFileUpload" hidden />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M20.33 17.657C20.44 17.291 20.5 16.902 20.5 16.5V7.5C20.5 6.43913 20.0786 5.42172 19.3284 4.67157C18.5783 3.92143 17.5609 3.5 16.5 3.5H7.5C6.43913 3.5 5.42172 3.92143 4.67157 4.67157C3.92143 5.42172 3.5 6.43913 3.5 7.5V16.57C3.51835 17.6187 3.94787 18.6182 4.69604 19.3533C5.4442 20.0884 6.45115 20.5002 7.5 20.5H16.5L16.617 20.498M20.33 17.657L20.242 17.553L17.776 14.577C17.5889 14.3513 17.3544 14.1694 17.0892 14.0443C16.824 13.9193 16.5346 13.8541 16.2414 13.8533C15.9482 13.8525 15.6584 13.9162 15.3925 14.0399C15.1267 14.1636 14.8913 14.3442 14.703 14.569L13.391 16.135L13.177 16.396M20.33 17.657C20.0874 18.4603 19.5984 19.166 18.932 19.676C18.2657 20.1861 17.4558 20.4736 16.617 20.498M13.177 16.396L16.524 20.392L16.617 20.498M13.177 16.396L9.95 12.543C9.76228 12.319 9.52774 12.1388 9.26288 12.0152C8.99802 11.8916 8.70929 11.8275 8.417 11.8275C8.12471 11.8275 7.83598 11.8916 7.57112 12.0152C7.30626 12.1388 7.07172 12.319 6.884 12.543L3.678 16.37L3.501 16.571"
                            stroke="#303030" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path
                            d="M15.091 10.4092C15.9194 10.4092 16.591 9.73761 16.591 8.90918C16.591 8.08075 15.9194 7.40918 15.091 7.40918C14.2626 7.40918 13.591 8.08075 13.591 8.90918C13.591 9.73761 14.2626 10.4092 15.091 10.4092Z"
                            fill="#303030" />
                    </svg>
                    <span>Добавьте фото</span>
                </label>

                <div v-if="mediaFiles.length > 0" class="media-preview">
                    <div v-for="(file, index) in mediaFiles" :key="index" class="preview-item">
                        <img v-if="file.type.startsWith('image/')" :src="file.preview" alt="preview" />
                        <video v-else-if="file.type.startsWith('video/')" :src="file.preview" controls></video>
                        <button class="remove-btn" @click="removeFile(index)">Удалить изображение</button>
                    </div>
                </div>
            </div>

            <Button class="submit-btn" btnTitle="Отправить отзыв" @click="submitReview"
                :disabled="!reviewText.trim() || rating.value === 0" />
        </div>

        <div class="review__upload" v-else>
            <h1 class="title">Ваш отзыв отправлен!</h1>
        </div>

        <p class="bottom-text">Продолжи уход с новыми качественными продуктами от нас</p>

        <RouterLink to="/" @click="userStore.clearCourse()">
            <Button class="btn-alt" btnTitle="Пройти диагностику заново"></Button>
        </RouterLink>
    </div>
</template>

<style lang="scss" scoped>
.review__upload {
    text-align: center;
}

.review-textarea {
    border: 1px solid #000;
    max-width: 430px;
    width: 100%;
    background-color: #FFF;
    border-radius: 35px;
    padding: 20px;
    min-height: 130px;
}

.under-title {
    margin-bottom: 30px;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    font-family: var(--font-amazing);
}

.title {
    font-family: var(--font-amazing);
    font-size: 30px;
    font-weight: 700;
    margin-bottom: 6px;
    text-align: center;
}

.subtitle {
    text-align: center;
    margin: 0 auto;
    line-height: 110%;

    a {
        font-weight: 700;
    }
}

.review-text {
    line-height: 100%;
    margin-top: 30px;
    margin-bottom: 10px;
}

.upload-label {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
}

.preview-item {
    border: 1px solid #000;
    border-radius: 30px;
    margin-bottom: 20px;
}

.remove-btn {
    display: block;
    margin: 0 auto;
    padding: 10px 0;
    font-weight: 700;
}

.stars {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    margin-bottom: 8px;
}

.star {
    font-size: 32px;
    cursor: pointer;
    color: #e0e0e0;
    transition: color 0.2s;

    &:hover {
        color: #FFDA53;
    }

    &.active {
        color: #FFDA53;
    }
}

.bottom-text {
    display: block;
    font-size: 18px;
    text-align: center;
    margin: 50px auto 20px;
    line-height: 100%;
}

.btn-alt {
    background-color: #FFF;
    border: 1px solid #C7C7C7;
    color: #000;
    margin-top: 10px;
}
</style>