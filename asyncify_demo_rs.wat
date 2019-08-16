(module
  (type $t0 (func (result i32)))
  (type $t1 (func (param i32) (result i32)))
  (type $t2 (func (param i32)))
  (type $t3 (func))
  (import "env" "prompt" (func $env.prompt (type $t0)))
  (func $add (type $t1) (param $p0 i32) (result i32)
    (local $l1 i32) (local $l2 i32) (local $l3 i32)
    (if $I0
      (i32.eq
        (global.get $g2)
        (i32.const 2))
      (then
        (i32.store
          (local.tee $p0
            (global.get $g3))
          (i32.add
            (i32.load
              (local.get $p0))
            (i32.const -8)))
        (local.set $p0
          (i32.load
            (local.tee $l2
              (i32.load
                (local.get $p0)))))
        (local.set $l2
          (i32.load offset=4
            (local.get $l2)))))
    (block $B1
      (if $I3
        (select
          (i32.eqz
            (if $I2 (result i32)
              (i32.eq
                (global.get $g2)
                (i32.const 2))
              (then
                (i32.store
                  (local.tee $l1
                    (global.get $g3))
                  (i32.add
                    (i32.load
                      (local.get $l1))
                    (i32.const -4)))
                (i32.load
                  (i32.load
                    (local.get $l1))))
              (else
                (i32.const 0))))
          (i32.const 1)
          (global.get $g2))
        (then
          (call $add2)
          (br_if $B1
            (i32.eq
              (global.get $g2)
              (i32.const 1)))
          (local.set $l2)))
      (if $I4
        (i32.eqz
          (global.get $g2))
        (then
          (return
            (i32.add
              (local.get $p0)
              (local.get $l2)))))
      (unreachable))
    (i32.store
      (i32.load
        (local.tee $l1
          (global.get $g3)))
      (i32.const 0))
    (i32.store
      (local.get $l1)
      (i32.add
        (i32.load
          (local.get $l1))
        (i32.const 4)))
    (i32.store
      (local.tee $l3
        (i32.load
          (local.get $l1)))
      (local.get $p0))
    (i32.store offset=4
      (local.get $l3)
      (local.get $l2))
    (i32.store
      (local.get $l1)
      (i32.add
        (i32.load
          (local.get $l1))
        (i32.const 8)))
    (i32.const 0))
  (func $add2 (type $t0) (result i32)
    (local $l0 i32) (local $l1 i32)
    (if $I0
      (i32.eq
        (global.get $g2)
        (i32.const 2))
      (then
        (i32.store
          (local.tee $l1
            (global.get $g3))
          (i32.add
            (i32.load
              (local.get $l1))
            (i32.const -4)))
        (local.set $l1
          (i32.load
            (i32.load
              (local.get $l1))))))
    (block $B1
      (if $I3
        (select
          (i32.eqz
            (if $I2 (result i32)
              (i32.eq
                (global.get $g2)
                (i32.const 2))
              (then
                (i32.store
                  (local.tee $l0
                    (global.get $g3))
                  (i32.add
                    (i32.load
                      (local.get $l0))
                    (i32.const -4)))
                (i32.load
                  (i32.load
                    (local.get $l0))))
              (else
                (i32.const 0))))
          (i32.const 1)
          (global.get $g2))
        (then
          (call $env.prompt)
          (br_if $B1
            (i32.eq
              (global.get $g2)
              (i32.const 1)))
          (local.set $l1)))
      (if $I4
        (i32.eqz
          (global.get $g2))
        (then
          (return
            (local.get $l1))))
      (unreachable))
    (i32.store
      (i32.load
        (local.tee $l0
          (global.get $g3)))
      (i32.const 0))
    (i32.store
      (local.get $l0)
      (i32.add
        (i32.load
          (local.get $l0))
        (i32.const 4)))
    (i32.store
      (i32.load
        (local.get $l0))
      (local.get $l1))
    (i32.store
      (local.get $l0)
      (i32.add
        (i32.load
          (local.get $l0))
        (i32.const 4)))
    (i32.const 0))
  (func $asyncify_start_unwind (type $t2) (param $p0 i32)
    (global.set $g2
      (i32.const 1))
    (global.set $g3
      (local.get $p0))
    (if $I0
      (i32.gt_u
        (i32.load
          (local.tee $p0
            (global.get $g3)))
        (i32.load offset=4
          (local.get $p0)))
      (then
        (unreachable))))
  (func $asyncify_stop_unwind (type $t3)
    (local $l0 i32)
    (global.set $g2
      (i32.const 0))
    (if $I0
      (i32.gt_u
        (i32.load
          (local.tee $l0
            (global.get $g3)))
        (i32.load offset=4
          (local.get $l0)))
      (then
        (unreachable))))
  (func $asyncify_start_rewind (type $t2) (param $p0 i32)
    (global.set $g2
      (i32.const 2))
    (global.set $g3
      (local.get $p0))
    (if $I0
      (i32.gt_u
        (i32.load
          (local.tee $p0
            (global.get $g3)))
        (i32.load offset=4
          (local.get $p0)))
      (then
        (unreachable))))
  (memory $memory 16)
  (global $__heap_base i32 (i32.const 1048576))
  (global $__data_end i32 (i32.const 1048576))
  (global $g2 (mut i32) (i32.const 0))
  (global $g3 (mut i32) (i32.const 0))
  (export "memory" (memory 0))
  (export "__heap_base" (global 0))
  (export "__data_end" (global 1))
  (export "add" (func $add))
  (export "add2" (func $add2))
  (export "asyncify_start_unwind" (func $asyncify_start_unwind))
  (export "asyncify_stop_unwind" (func $asyncify_stop_unwind))
  (export "asyncify_start_rewind" (func $asyncify_start_rewind))
  (export "asyncify_stop_rewind" (func $asyncify_stop_unwind)))
