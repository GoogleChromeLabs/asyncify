(module
	(global $g (import "env" "global") (mut i32))
	(func $inc
		(global.set $g (i32.add (global.get $g) (i32.const 1)))
	)
	(export "inc" (func $inc))
)
