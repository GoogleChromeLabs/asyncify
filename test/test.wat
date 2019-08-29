(module
  (func $env.get_time (import "env" "get_time") (result i32))
  (func $env.sleep (import "env" "sleep") (param i32))
  (func $run (export "run") (result i32)
    (local $start i32)
    (local.set $start
      (call $env.get_time))
    (call $env.sleep
      (i32.const 100))
    (i32.gt_u
      (i32.sub
        (call $env.get_time)
        (local.get $start))
      (i32.const 100)))
  (export "run2" (func $run))
  (memory $memory (export "memory") 16))
