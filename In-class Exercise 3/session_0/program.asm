	.text
	.file	"main"
	.globl	mmul_v1
	.p2align	4, 0x90
	.type	mmul_v1,@function
mmul_v1:
	.cfi_startproc
	pushq	%r15
.Lcfi0:
	.cfi_def_cfa_offset 16
	pushq	%r14
.Lcfi1:
	.cfi_def_cfa_offset 24
	pushq	%r13
.Lcfi2:
	.cfi_def_cfa_offset 32
	pushq	%r12
.Lcfi3:
	.cfi_def_cfa_offset 40
	pushq	%rsi
.Lcfi4:
	.cfi_def_cfa_offset 48
	pushq	%rdi
.Lcfi5:
	.cfi_def_cfa_offset 56
	pushq	%rbp
.Lcfi6:
	.cfi_def_cfa_offset 64
	pushq	%rbx
.Lcfi7:
	.cfi_def_cfa_offset 72
	subq	$64, %rsp
.Lcfi8:
	.cfi_def_cfa_offset 136
.Lcfi9:
	.cfi_offset %rbx, -72
.Lcfi10:
	.cfi_offset %rbp, -64
.Lcfi11:
	.cfi_offset %rdi, -56
.Lcfi12:
	.cfi_offset %rsi, -48
.Lcfi13:
	.cfi_offset %r12, -40
.Lcfi14:
	.cfi_offset %r13, -32
.Lcfi15:
	.cfi_offset %r14, -24
.Lcfi16:
	.cfi_offset %r15, -16
	movslq	(%rcx), %r11
	movl	%r11d, %esi
	movq	8(%rcx), %rax
	movq	%rax, 40(%rsp)
	movq	16(%rcx), %r10
	movq	24(%rcx), %r14
	movq	88(%rcx), %rax
	movq	96(%rcx), %r13
	movq	(%rdx), %rbp
	movq	%rax, 32(%rsp)
	imulq	%rax, %rbp
	addq	40(%rcx), %rbp
	movq	%rbp, (%rsp)
	movq	8(%rdx), %rax
	imulq	%r13, %rax
	addq	48(%rcx), %rax
	movq	%rax, 16(%rsp)
	movq	%r13, %rdi
	sarq	$3, %rdi
	movq	%r13, %rax
	andq	$-8, %rax
	movq	%rax, 24(%rsp)
	subq	%rax, %r13
	testq	%rdi, %rdi
	movq	%rsi, 48(%rsp)
	je	.LBB0_9
	movq	(%rsp), %rax
	movl	%eax, %edx
	imull	%r11d, %edx
	leaq	(,%r11,4), %rcx
	movq	%rsi, %rbp
	negq	%rbp
	xorl	%ebx, %ebx
	.p2align	4, 0x90
.LBB0_2:
	movq	%rbx, 56(%rsp)
	movl	%edx, 12(%rsp)
	movslq	%edx, %rdx
	movq	40(%rsp), %rbx
	leaq	(%rbx,%rdx,4), %rbx
	movl	%eax, %r15d
	imull	%esi, %r15d
	xorl	%r12d, %r12d
	movq	16(%rsp), %r8
	.p2align	4, 0x90
.LBB0_3:
	testl	%r11d, %r11d
	jle	.LBB0_4
	movslq	%r8d, %rdx
	leaq	(%r10,%rdx,4), %rsi
	vxorps	%ymm0, %ymm0, %ymm0
	movq	%rbp, %rdx
	movq	%rbx, %r9
	.p2align	4, 0x90
.LBB0_6:
	vbroadcastss	(%r9), %ymm1
	vfmadd231ps	(%rsi), %ymm1, %ymm0
	addq	%rcx, %rsi
	addq	$4, %r9
	addq	$1, %rdx
	jne	.LBB0_6
	jmp	.LBB0_7
	.p2align	4, 0x90
.LBB0_4:
	vxorps	%ymm0, %ymm0, %ymm0
.LBB0_7:
	leal	(%r15,%r8), %edx
	movslq	%edx, %rdx
	vmovups	%ymm0, (%r14,%rdx,4)
	addq	$1, %r12
	addq	$8, %r8
	cmpq	%rdi, %r12
	jne	.LBB0_3
	movq	56(%rsp), %rbx
	addq	$1, %rbx
	addq	$1, %rax
	movq	48(%rsp), %rsi
	movl	12(%rsp), %edx
	addl	%esi, %edx
	cmpq	32(%rsp), %rbx
	jne	.LBB0_2
.LBB0_9:
	testq	%r13, %r13
	movq	(%rsp), %rdi
	je	.LBB0_18
	movl	%edi, %r9d
	imull	%r11d, %r9d
	movq	16(%rsp), %rax
	addq	%rax, 24(%rsp)
	leaq	(,%r11,4), %rcx
	movq	%rsi, %r8
	negq	%r8
	xorl	%r12d, %r12d
	.p2align	4, 0x90
.LBB0_11:
	movslq	%r9d, %rax
	movq	40(%rsp), %rdx
	leaq	(%rdx,%rax,4), %r15
	movq	%rdi, (%rsp)
	imull	%esi, %edi
	xorl	%ebx, %ebx
	movq	24(%rsp), %rsi
	.p2align	4, 0x90
.LBB0_12:
	testl	%r11d, %r11d
	jle	.LBB0_13
	movslq	%esi, %rax
	leaq	(%r10,%rax,4), %rdx
	vxorps	%xmm0, %xmm0, %xmm0
	movq	%r8, %rbp
	movq	%r15, %rax
	.p2align	4, 0x90
.LBB0_15:
	vmovss	(%rax), %xmm1
	vfmadd231ss	(%rdx), %xmm1, %xmm0
	addq	%rcx, %rdx
	addq	$4, %rax
	addq	$1, %rbp
	jne	.LBB0_15
	jmp	.LBB0_16
	.p2align	4, 0x90
.LBB0_13:
	vxorps	%xmm0, %xmm0, %xmm0
.LBB0_16:
	leal	(%rdi,%rsi), %eax
	cltq
	vmovss	%xmm0, (%r14,%rax,4)
	addq	$1, %rbx
	addq	$1, %rsi
	cmpq	%r13, %rbx
	jne	.LBB0_12
	addq	$1, %r12
	movq	(%rsp), %rdi
	addq	$1, %rdi
	movq	48(%rsp), %rsi
	addl	%esi, %r9d
	cmpq	32(%rsp), %r12
	jne	.LBB0_11
.LBB0_18:
	addq	$64, %rsp
	popq	%rbx
	popq	%rbp
	popq	%rdi
	popq	%rsi
	popq	%r12
	popq	%r13
	popq	%r14
	popq	%r15
	vzeroupper
	retq
.Lfunc_end0:
	.size	mmul_v1, .Lfunc_end0-mmul_v1
	.cfi_endproc


	.ident	"clang version 4.0.1 "
	.section	".note.GNU-stack","",@progbits
