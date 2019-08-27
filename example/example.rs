extern "C" {
    fn read_number() -> i32;
    fn print_number(num: i32);
}

#[no_mangle]
pub extern fn run() {
    let a = unsafe { read_number() };
    let b = unsafe { read_number() };
    let res = a + b;
    unsafe { print_number(res) };
}
