<script lang="ts">
	import { Bell } from 'lucide-svelte';
</script>

<header class="border-b bg-white shadow-sm">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between py-6">
			<a href="/" class="flex items-center space-x-3 text-decoration-none">
				<div class="rounded-lg bg-blue-100 p-2">
					<Bell class="h-8 w-8 text-blue-600" />
				</div>
				<div>
					<h1 class="text-2xl font-bold text-gray-900">LawCast</h1>
					<p class="text-sm text-gray-600">국회 입법예고 디스코드 알리미</p>
				</div>
			</a>
		</div>
	</div>
</header>

<style>
	a {
		text-decoration: none;
		color: inherit;
	}
	
	a:hover {
		color: inherit;
	}
</style>