(module
  (import "env" "sleep" (func $sleep (param i32) (result i32)))
  (func $start_loop
    (loop
      (br_if 0
        (call $sleep (i32.const 0)))))
  (memory 16)
  (export "memory" (memory 0))
  (export "start_loop" (func $start_loop)))
