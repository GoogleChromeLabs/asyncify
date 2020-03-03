typedef struct stack_linked_list stack_linked_list_t;

extern void side_effect(stack_linked_list_t list);

struct stack_linked_list {
	const stack_linked_list_t *prev;
	int value;
};

void range_list(stack_linked_list_t list, int start, int end) {
	if (start > end) {
		side_effect(list);
	} else {
		return range_list((stack_linked_list_t) {
			.prev = &list,
			.value = start
		}, start + 1, end);
	}
}
