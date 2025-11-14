<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, Bell, Plus, Trash2, ExternalLink, RefreshCw } from 'lucide-svelte';
	import axios from 'axios';

	const API_BASE = 'http://localhost:3001/api';

	interface Webhook {
		id: number;
		description: string;
		createdAt: string;
	}

	interface Notice {
		id: number;
		num: number;
		subject: string;
		proposerCategory: string;
		committee: string;
		numComments: number;
		link: string;
		createdAt: string;
	}

	let webhooks: Webhook[] = [];
	let recentNotices: Notice[] = [];
	let stats = { webhooks: { total: 0, active: 0, inactive: 0 }, cache: { size: 0, lastUpdated: null, maxSize: 50 } };
	let newWebhookUrl = '';
	let newWebhookDescription = '';
	let recaptchaToken = 'dummy_token'; // TODO: 실제 reCAPTCHA 구현
	let isLoading = false;
	let error = '';
	let success = '';

	onMount(async () => {
		await loadWebhooks();
		await loadRecentNotices();
		await loadStats();
	});

	async function loadWebhooks() {
		try {
			const response = await axios.get(`${API_BASE}/webhooks`);
			webhooks = response.data.data;
		} catch (err) {
			console.error('Failed to load webhooks:', err);
		}
	}

	async function loadRecentNotices() {
		try {
			const response = await axios.get(`${API_BASE}/notices/recent`);
			recentNotices = response.data.data;
		} catch (err) {
			console.error('Failed to load recent notices:', err);
		}
	}

	async function loadStats() {
		try {
			const response = await axios.get(`${API_BASE}/stats`);
			stats = response.data.data;
		} catch (err) {
			console.error('Failed to load stats:', err);
		}
	}

	async function addWebhook() {
		if (!newWebhookUrl.trim()) {
			error = '웹훅 URL을 입력해주세요.';
			return;
		}

		if (!newWebhookUrl.includes('discord.com/api/webhooks/')) {
			error = '올바른 Discord 웹훅 URL을 입력해주세요.';
			return;
		}

		isLoading = true;
		error = '';
		success = '';

		try {
			const response = await axios.post(`${API_BASE}/webhooks`, {
				url: newWebhookUrl,
				description: newWebhookDescription || undefined,
				recaptchaToken
			});

			success = response.data.message;
			newWebhookUrl = '';
			newWebhookDescription = '';
			await loadWebhooks();
		} catch (err: any) {
			error = err.response?.data?.message || '웹훅 등록에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

	async function removeWebhook(id: number) {
		if (!confirm('정말로 이 웹훅을 삭제하시겠습니까?')) return;

		try {
			await axios.delete(`${API_BASE}/webhooks/${id}`);
			await loadWebhooks();
			success = '웹훅이 삭제되었습니다.';
		} catch (err) {
			error = '웹훅 삭제에 실패했습니다.';
		}
	}

	async function manualCheck() {
		isLoading = true;
		error = '';
		success = '';

		try {
			const response = await axios.post(`${API_BASE}/check`);
			success = response.data.message;
			await loadRecentNotices();
			await loadStats();
		} catch (err) {
			error = '수동 체크에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

	function clearMessage() {
		error = '';
		success = '';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('ko-KR');
	}
</script>

<svelte:head>
	<title>LawCast - 국회 입법예고 알리미</title>
	<meta name="description" content="국회 입법예고 변동사항을 디스코드로 알려드립니다." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center space-x-3">
					<div class="p-2 bg-blue-100 rounded-lg">
						<Bell class="h-8 w-8 text-blue-600" />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-gray-900">LawCast</h1>
						<p class="text-sm text-gray-600">국회 입법예고 디스코드 알리미</p>
					</div>
				</div>
				<button
					on:click={manualCheck}
					disabled={isLoading}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<RefreshCw class="h-4 w-4 mr-2 {isLoading ? 'animate-spin' : ''}" />
					{isLoading ? '확인 중...' : '수동 체크'}
				</button>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<!-- Messages -->
		{#if error}
			<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
				<div class="flex items-center">
					<AlertTriangle class="h-5 w-5 text-red-600 mr-2" />
					<span class="text-red-800">{error}</span>
					<button on:click={clearMessage} class="ml-auto text-red-600 hover:text-red-800">×</button>
				</div>
			</div>
		{/if}

		{#if success}
			<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
				<div class="flex items-center">
					<div class="h-5 w-5 text-green-600 mr-2">✓</div>
					<span class="text-green-800">{success}</span>
					<button on:click={clearMessage} class="ml-auto text-green-600 hover:text-green-800">×</button>
				</div>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Webhook Registration -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
					<Plus class="h-5 w-5 mr-2" />
					웹훅 등록
				</h2>
				
				<form on:submit|preventDefault={addWebhook} class="space-y-4">
					<div>
						<label for="webhook-url" class="block text-sm font-medium text-gray-700 mb-2">
							Discord 웹훅 URL *
						</label>
						<input
							id="webhook-url"
							type="url"
							bind:value={newWebhookUrl}
							placeholder="https://discord.com/api/webhooks/..."
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							required
						/>
					</div>
					
					<div>
						<label for="webhook-description" class="block text-sm font-medium text-gray-700 mb-2">
							설명 (선택사항)
						</label>
						<input
							id="webhook-description"
							type="text"
							bind:value={newWebhookDescription}
							placeholder="예: 개발팀 알림"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					
					<button
						type="submit"
						disabled={isLoading}
						class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
					>
						{isLoading ? '등록 중...' : '웹훅 등록'}
					</button>
				</form>

				<!-- Registered Webhooks -->
				<div class="mt-6">
					<h3 class="text-md font-medium text-gray-900 mb-3">등록된 웹훅 ({webhooks.length})</h3>
					{#if webhooks.length === 0}
						<p class="text-gray-500 text-sm">등록된 웹훅이 없습니다.</p>
					{:else}
						<div class="space-y-2">
							{#each webhooks as webhook}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
									<div>
										<p class="text-sm font-medium text-gray-900">
											{webhook.description || `웹훅 #${webhook.id}`}
										</p>
										<p class="text-xs text-gray-500">
											등록: {formatDate(webhook.createdAt)}
										</p>
									</div>
									<button
										on:click={() => removeWebhook(webhook.id)}
										class="text-red-600 hover:text-red-800 p-1"
										title="삭제"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Recent Notices -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">
					최근 입법예고 ({recentNotices.length})
				</h2>
				
				{#if recentNotices.length === 0}
					<p class="text-gray-500">아직 수집된 입법예고가 없습니다.</p>
				{:else}
					<div class="space-y-3">
						{#each recentNotices.slice(0, 10) as notice}
							<div class="border border-gray-200 rounded-md p-3">
								<div class="flex justify-between items-start mb-2">
									<h3 class="text-sm font-medium text-gray-900 line-clamp-2">
										{notice.subject}
									</h3>
									<a
										href={notice.link}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-600 hover:text-blue-800 ml-2"
										title="자세히 보기"
									>
										<ExternalLink class="h-4 w-4" />
									</a>
								</div>
								<div class="flex justify-between items-center text-xs text-gray-500">
									<span>{notice.proposerCategory} | {notice.committee}</span>
									<span>의견 {notice.numComments}개</span>
								</div>
								<div class="text-xs text-gray-400 mt-1">
									{formatDate(notice.createdAt)}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Stats Section -->
		<div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-white rounded-lg shadow p-4">
				<h3 class="text-sm font-medium text-gray-600">등록된 웹훅</h3>
				<p class="text-2xl font-bold text-blue-600">{stats.webhooks.active}</p>
				<p class="text-xs text-gray-500">활성 / 총 {stats.webhooks.total}개</p>
			</div>
			<div class="bg-white rounded-lg shadow p-4">
				<h3 class="text-sm font-medium text-gray-600">캐시된 입법예고</h3>
				<p class="text-2xl font-bold text-green-600">{stats.cache.size}</p>
				<p class="text-xs text-gray-500">최대 {stats.cache.maxSize}개</p>
			</div>
			<div class="bg-white rounded-lg shadow p-4">
				<h3 class="text-sm font-medium text-gray-600">마지막 업데이트</h3>
				<p class="text-sm font-medium text-gray-900">
					{stats.cache.lastUpdated ? formatDate(stats.cache.lastUpdated) : '없음'}
				</p>
			</div>
		</div>

		<!-- Info Section -->
		<div class="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
			<h3 class="text-md font-medium text-blue-900 mb-2">서비스 안내</h3>
			<ul class="text-sm text-blue-800 space-y-1">
				<li>• 10분마다 자동으로 새로운 입법예고를 확인합니다</li>
				<li>• 새로운 입법예고 발견 시 등록된 Discord 웹훅으로 알림을 전송합니다</li>
				<li>• 로그인 없이 간단하게 웹훅만 등록하면 사용할 수 있습니다</li>
				<li>• Discord 채널/서버에서 웹훅 URL을 발급받아 등록해주세요</li>
				<li>• ✨ 개선: 메모리 캐시로 빠른 응답, 실패한 웹훅 자동 삭제, 병렬 알림 처리</li>
			</ul>
		</div>
	</main>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
