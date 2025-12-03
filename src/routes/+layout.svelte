<script lang="ts">
	import '../app.css';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import { config } from '@fortawesome/fontawesome-svg-core';
	import favicon from '$lib/assets/favicon.svg';

	config.autoAddCss = false;

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
