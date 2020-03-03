(module
  (func $env.call_main (import "env" "call_main") (param i32))
  (func $callback (export "callback") (param $counter i32)
    (if
      (i32.gt_s
        (local.get $counter)
        (i32.const 0))
      (call $env.call_main
        (local.tee $counter
          (i32.sub
            (local.get $counter)
            (i32.const 1))))))
  (memory $memory (export "memory") 16))
