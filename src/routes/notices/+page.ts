import { apiClient } from '$lib/api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const notices = await apiClient.getRecentNotices(fetch);
		return { notices };
	} catch (err) {
		console.error('Failed to load notices:', err);
		return {
			notices: [],
			error: '입법예고 데이터를 불러오는데 실패했습니다.'
		};
	}
};
