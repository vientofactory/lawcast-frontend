<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_RECAPTCHA_SITE_KEY } from '$env/static/public';
	import { apiClient } from '$lib/api/client';
	import { validateDiscordWebhookUrl, normalizeWebhookUrl } from '$lib/utils/helpers';
	import WebhookGuide from './WebhookGuide.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
	import type { SystemStats } from '$lib/types/api';

	const RECAPTCHA_SITE_KEY_VAL = PUBLIC_RECAPTCHA_SITE_KEY || '';

	// Props
	export let isInitialLoading = false;
	export let stats: SystemStats | undefined = undefined;
	export let onSuccess: (message: string) => void = () => {};
	export let onError: (message: string) => void = () => {};
	export let onClearMessage: () => void = () => {};
	export let onWebhookRegistered: () => void = () => {};

	let recaptchaLoaded = false;
	let recaptchaWidgetId: number | null = null;
	let newWebhookUrl = '';
	let recaptchaToken = '';
	let isSubmitting = false;
	onMount(() => {
		loadRecaptcha();
		// reCAPTCHA 로드가 늦을 경우를 대비해 지연 렌더링 시도
		setTimeout(() => {
			if (recaptchaLoaded && recaptchaWidgetId === null) {
				renderRecaptcha();
			}
		}, 1000);
	});

	function loadRecaptcha() {
		if (typeof window !== 'undefined' && !recaptchaLoaded) {
			const script = document.createElement('script');
			script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);

			// 전역 콜백 설정
			(window as unknown as Window & { onRecaptchaLoad: () => void }).onRecaptchaLoad = () => {
				recaptchaLoaded = true;
				renderRecaptcha();
			};
		}
	}

	function renderRecaptcha() {
		if (
			typeof window !== 'undefined' &&
			(
				window as unknown as {
					grecaptcha: { render: (container: string, options: Record<string, unknown>) => number };
				}
			).grecaptcha &&
			recaptchaLoaded
		) {
			const container = document.getElementById('recaptcha-container');
			if (container && recaptchaWidgetId === null) {
				recaptchaWidgetId = (
					window as unknown as {
						grecaptcha: { render: (container: string, options: Record<string, unknown>) => number };
					}
				).grecaptcha.render('recaptcha-container', {
					sitekey: RECAPTCHA_SITE_KEY_VAL,
					callback: (token: string) => {
						recaptchaToken = token;
					},
					'expired-callback': () => {
						recaptchaToken = '';
					},
					'error-callback': () => {
						onError('reCAPTCHA 인증에 실패했습니다. 다시 시도해주세요.');
						recaptchaToken = '';
					}
				});
			}
		}
	}

	function resetRecaptcha() {
		if (
			typeof window !== 'undefined' &&
			(window as unknown as { grecaptcha: { reset: (id: number) => void } }).grecaptcha &&
			recaptchaWidgetId !== null
		) {
			(window as unknown as { grecaptcha: { reset: (id: number) => void } }).grecaptcha.reset(
				recaptchaWidgetId
			);
			recaptchaToken = '';
		}
	}

	async function addWebhook() {
		// 웹훅 URL 유효성 검증
		const validation = validateDiscordWebhookUrl(newWebhookUrl);
		if (!validation.isValid) {
			onError(validation.message || '올바르지 않은 웹훅 URL입니다.');
			return;
		}

		// reCAPTCHA 검증
		if (!recaptchaToken || recaptchaToken.trim().length === 0) {
			onError('reCAPTCHA 인증을 완료해주세요.');
			return;
		}

		// 중복 제출 방지
		if (isSubmitting) {
			return;
		}

		isSubmitting = true;
		onClearMessage();

		try {
			// URL 정규화
			const normalizedUrl = normalizeWebhookUrl(newWebhookUrl);

			const result = await apiClient.registerWebhook({
				url: normalizedUrl,
				recaptchaToken: recaptchaToken.trim()
			});

			if (result.success) {
				onSuccess(result.message || '웹훅이 성공적으로 등록되었습니다.');
				newWebhookUrl = '';
				resetRecaptcha();
				onWebhookRegistered(); // 통계 업데이트를 위한 이벤트
			} else {
				onError(result.message || '웹훅 등록에 실패했습니다.');
				resetRecaptcha();
			}
		} catch (err: unknown) {
			resetRecaptcha();

			if (err instanceof Error) {
				onError(err.message);
			} else {
				onError('예상치 못한 오류가 발생했습니다.');
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div
	class="rounded-2xl border border-white/50 bg-white/80 p-6 shadow-lg shadow-blue-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/60"
>
	<h2 class="mb-6 flex items-center text-xl font-bold tracking-tight text-gray-800">
		<div class="mr-3 rounded-lg bg-linear-to-r from-blue-500 to-indigo-500 p-2">
			<FontAwesomeIcon icon={faPlus} class="h-5 w-5 text-white" />
		</div>
		웹훅 등록
	</h2>

	<ul class="mb-6 space-y-2 text-sm text-gray-600">
		<li class="flex items-start">
			<span class="mt-1.5 mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"></span>
			10분마다 자동으로 새로운 입법예고를 확인합니다
		</li>
		<li class="flex items-start">
			<span class="mt-1.5 mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"></span>
			새로운 입법예고 발견 시 Discord 웹훅으로 알림을 전송합니다
		</li>
		<li class="flex items-start">
			<span class="mt-1.5 mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"></span>
			로그인 없이 간단하게 Discord 웹훅 URL만 등록하면 됩니다
		</li>
		{#if stats}
			<li class="flex items-start font-medium text-blue-700">
				<span class="mt-1.5 mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600"></span>
				현재 {stats.webhooks.active.toLocaleString()}개의 채널에 알림을 전송하고 있습니다
			</li>
		{/if}
	</ul>

	<form on:submit|preventDefault={addWebhook} class="space-y-4">
		<div>
			<label for="webhook-url" class="mb-2 block text-sm font-medium text-gray-700">
				Discord 웹훅 URL *
			</label>
			<input
				id="webhook-url"
				type="url"
				bind:value={newWebhookUrl}
				placeholder="https://discord.com/api/webhooks/..."
				class="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-700 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none"
				maxlength="500"
				autocomplete="off"
				spellcheck="false"
				required
			/>
			{#if newWebhookUrl && !validateDiscordWebhookUrl(newWebhookUrl).isValid}
				<p class="mt-1 text-sm text-red-600">
					{validateDiscordWebhookUrl(newWebhookUrl).message}
				</p>
			{/if}
		</div>

		<!-- reCAPTCHA -->
		<div>
			<div id="recaptcha-container" class="mb-4"></div>
			{#if !recaptchaLoaded}
				<div class="mb-2 text-sm text-gray-500">
					<FontAwesomeIcon icon={faSpinner} class="mr-1 inline h-4 w-4 animate-spin" />
					reCAPTCHA 로딩 중...
				</div>
			{/if}
		</div>

		<button
			type="submit"
			disabled={isSubmitting || isInitialLoading}
			class="flex w-full cursor-pointer items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200/50 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-300/60 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
		>
			{#if isSubmitting}
				<FontAwesomeIcon icon={faSpinner} class="mr-2 h-4 w-4 animate-spin" />
				등록 중...
			{:else}
				<FontAwesomeIcon icon={faPlus} class="mr-2 h-4 w-4" />
				웹훅 등록
			{/if}
		</button>
	</form>

	<WebhookGuide />
</div>
