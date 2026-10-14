#!/bin/bash
cd "$(dirname "$0")/../.."
D=day-19-capstone-leave-request; F=$D/src/LeaveRequestForm.tsx; OUT=$D/evidence/flow_mutation_check.txt; : > $OUT
cp $F /tmp/form.bak
try(){ name="$1"
  python3 - "$2" "$3" <<'PY'
import sys
p="day-19-capstone-leave-request/src/LeaveRequestForm.tsx"; s=open(p).read(); a,b=sys.argv[1],sys.argv[2]
assert a in s, a; open(p,"w").write(s.replace(a,b,1))
PY
  if [ $? -ne 0 ]; then echo "mutant [$name]: HARNESS ERROR - pattern not found, mutation NOT applied" | tee -a $OUT; cp /tmp/form.bak $F; return; fi
  node $D/tools/build_demo.mjs >/dev/null
  res=$(python3 $D/tools/browser_flow.py 2>&1 | grep -E "FLOW FAILED" | head -1)
  if [ -n "$res" ]; then v="CAUGHT  -> ${res:0:130}"; else v="MISSED (flow still passed)"; fi
  echo "mutant [$name]: $v" | tee -a $OUT
  cp /tmp/form.bak $F
}
try "error summary never takes focus" "if (summaryNonce > 0) summaryRef.current?.focus();" "if (summaryNonce > 0) { /* no focus */ }"
try "form not cleared after success" "setValues(EMPTY);
      setShowErrors(false);" "setShowErrors(false);"
try "new request not added to My requests" '      setList((prev) => ({
        status: "success",
        data: [...(prev.status === "success" ? prev.data : []), created],
      }));' "      /* not listed */"
node $D/tools/build_demo.mjs >/dev/null
echo "restored -> flow result:"; python3 $D/tools/browser_flow.py 2>&1 | tail -1
