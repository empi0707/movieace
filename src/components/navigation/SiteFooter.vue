<template>
    <footer class="site-footer">
        <div class="container-lm">
            <!-- Masthead / colophon line -->
            <div class="site-footer__masthead">
                <div class="site-footer__logo" aria-hidden="true">
                    <img
                        class="site-footer__mark"
                        :src="logoUrl"
                        alt=""
                        @error="resetEmbedLogo"
                    />
                    <span class="site-footer__wordmark">{{ brand }}</span>
                </div>

                <div class="site-footer__issue">
                    <span class="eyebrow">Vol. {{ volume }}</span>
                    <span class="site-footer__sep" aria-hidden="true">·</span>
                    <span class="eyebrow">Issue {{ issue }}</span>
                    <span class="site-footer__sep" aria-hidden="true">·</span>
                    <span class="eyebrow">{{ month }} {{ year }}</span>
                </div>
            </div>

            <hr class="hairline site-footer__rule" />

            <!-- Columns -->
            <div class="site-footer__cols">
                <nav
                    v-for="col in columns"
                    :key="col.title"
                    class="site-footer__col"
                    :aria-label="col.title"
                >
                    <h3 class="eyebrow site-footer__col-title">{{ col.title }}</h3>
                    <ul class="site-footer__list">
                        <li v-for="link in col.links" :key="link.label">
                            <component
                                :is="link.external ? 'a' : 'router-link'"
                                :to="!link.external ? link.href : undefined"
                                :href="link.external ? link.href : undefined"
                                :target="link.external ? '_blank' : undefined"
                                :rel="link.external ? 'noopener noreferrer' : undefined"
                                class="site-footer__link"
                            >
                                {{ link.label }}
                            </component>
                        </li>
                    </ul>
                </nav>

                <div class="site-footer__col site-footer__col--wide">
                    <h3 class="eyebrow site-footer__col-title">Colophon</h3>
                    <p class="site-footer__colophon">
                        Metadata &amp; artwork powered by
                        <a
                            href="https://www.themoviedb.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="site-footer__inline-link"
                        >TMDB</a>.
                        This product uses the TMDB API but is not endorsed or
                        certified by TMDB.
                    </p>
                    <p class="site-footer__colophon">
                        Streaming sources are provided by third-party embeds.
                        {{ brand }} does not host, upload, or store any video
                        content.
                    </p>
                </div>
            </div>
        </div>
    </footer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { BRAND, LOGO_URL, resetEmbedLogo } from '../../config/brand';

interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
}

interface FooterCol {
    title: string;
    links: FooterLink[];
}

const columns: FooterCol[] = [
    {
        title: 'Browse',
        links: [
            { label: 'Home', href: '/' },
            { label: 'Movies', href: '/movies' },
            { label: 'TV Shows', href: '/tv-shows' },
            { label: 'Actors', href: '/actors' },
            { label: 'Watchlist', href: '/watchlist' }
        ]
    },
    {
        title: 'About',
        links: [
            {
                label: 'TMDB',
                href: 'https://www.themoviedb.org/',
                external: true
            }
        ]
    }
];

export default defineComponent({
    name: 'SiteFooter',
    setup() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.toLocaleString('en-US', { month: 'long' });

        // Vol = years since 2024 (launch) + 1; Issue = week of year.
        const launch = 2024;
        const volume = computed(() =>
            String(year - launch + 1).padStart(2, '0')
        );

        const getWeek = (d: Date) => {
            const start = new Date(d.getFullYear(), 0, 1);
            const diff = (d.getTime() - start.getTime()) / 86400000;
            return Math.ceil((diff + start.getDay() + 1) / 7);
        };
        const issue = String(getWeek(now)).padStart(2, '0');

        return {
            brand: BRAND,
            logoUrl: LOGO_URL,
            resetEmbedLogo,
            year,
            month,
            volume,
            issue,
            columns
        };
    }
});
</script>

<style lang="scss" scoped>
.site-footer {
    position: relative;
    padding: var(--s-10) 0 var(--s-7);
    background: var(--ink-850);
    border-top: 1px solid var(--rule);
    color: var(--bone-200);
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(
            80% 60% at 10% 0%,
            rgba(var(--ember-rgb), 0.06) 0%,
            transparent 60%
        );
        pointer-events: none;
    }

    &__masthead {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--s-4);
        margin-bottom: var(--s-6);
        flex-wrap: wrap;
    }

    &__logo {
        display: inline-flex;
        align-items: center;
        gap: var(--s-3);
    }

    &__mark {
        display: block;
        width: 42px;
        height: 42px;
        object-fit: contain;
        border-radius: var(--r-sm);
        box-shadow: 0 6px 20px rgba(var(--ember-rgb), 0.25);
    }

    &__wordmark {
        font-family: var(--font-display);
        font-weight: 500;
        font-size: var(--fs-xl);
        color: var(--bone-50);
        letter-spacing: var(--ls-tight);
        font-variation-settings: 'opsz' 72;
    }

    &__issue {
        display: inline-flex;
        align-items: center;
        gap: var(--s-2);
        color: var(--bone-400);

        .eyebrow { color: var(--bone-400); }
    }

    &__sep {
        color: var(--bone-500);
    }

    &__rule {
        margin: var(--s-6) 0 var(--s-6);
    }

    &__cols {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--s-6);

        @media (max-width: 960px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 560px) {
            grid-template-columns: 1fr;
            gap: var(--s-5);
        }
    }

    &__col {
        &--wide {
            grid-column: span 2;

            @media (max-width: 960px) {
                grid-column: span 2;
            }

            @media (max-width: 560px) {
                grid-column: span 1;
            }
        }
    }

    &__col-title {
        color: var(--bone-400);
        margin-bottom: var(--s-4);
    }

    &__list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
    }

    &__link {
        font-family: var(--font-ui);
        font-size: var(--fs-base);
        color: var(--bone-200);
        transition: color var(--dur-fast) var(--ease-out);
        letter-spacing: var(--ls-snug);

        &:hover {
            color: var(--ember);
        }
    }

    &__colophon {
        font-size: var(--fs-sm);
        color: var(--bone-300);
        line-height: var(--lh-base);
        max-width: 56ch;
        margin-bottom: var(--s-3);

        em {
            color: var(--bone-50);
            font-style: italic;
            font-family: var(--font-display);
            font-variation-settings: 'opsz' 144, 'SOFT' 80;
        }
    }

    &__inline-link {
        color: var(--bone-50);
        text-decoration: underline;
        text-decoration-color: var(--rule-strong);
        text-underline-offset: 3px;
        transition: color var(--dur-fast), text-decoration-color var(--dur-fast);

        &:hover {
            color: var(--ember);
            text-decoration-color: var(--ember);
        }
    }

    &__meta {
        display: flex;
        align-items: center;
        gap: var(--s-3);
        color: var(--bone-400);
        flex-wrap: wrap;

        a { color: inherit; }
    }

    &__meta-divider {
        width: 3px;
        height: 3px;
        background: var(--bone-500);
        border-radius: 50%;
    }
}
</style>
