extern {
	fn get_time() -> u32;
	fn sleep(ms: u32);
}

#[no_mangle]
pub unsafe extern fn run() -> bool {
	let start = get_time();
	sleep(100);
	let end = get_time();
	(end - start) > 100
}
