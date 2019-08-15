extern "C" {
    fn prompt() -> i32;
}

#[no_mangle]
pub static mut ASYNCIFY_STACK: [u32; 1024] = [0; 1024];

#[no_mangle]
pub extern "C" fn add(x: i32) -> i32 {
    x + add2() + add2()
}

#[no_mangle]
#[inline(never)]
pub extern "C" fn add2() -> i32 {
    unsafe { prompt() }
}
