<template>
    <div class="error-state container-lm" role="alert">
        <p class="eyebrow">Reel jam</p>
        <h1 class="error-state__title display">{{ title }}</h1>
        <p class="error-state__desc">{{ message }}</p>
        <LmButton @click="$emit('retry')">Try again</LmButton>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { LmButton } from '../primitives';

export default defineComponent({
    name: 'ErrorState',
    components: { LmButton },
    props: {
        title: { type: String, default: 'This didn’t load.' },
        message: { type: String, default: 'Check your connection, then try again.' }
    },
    emits: ['retry']
});
</script>

<style lang="scss" scoped>
.error-state {
    text-align: center;
    padding-block: clamp(var(--s-8), 10vw, var(--s-10));
    max-width: 640px;

    &__title {
        font-family: var(--font-display);
        font-weight: 500;
        font-size: clamp(2rem, 5vw, 3.5rem);
        color: var(--bone-50);
        margin: var(--s-3) 0 var(--s-4);
        font-variation-settings: 'opsz' 144;
    }

    &__desc {
        color: var(--bone-300);
        line-height: 1.6;
        margin: 0 auto var(--s-6);
        max-width: 50ch;
    }
}
</style>
