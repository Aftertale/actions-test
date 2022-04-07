#! /bin/bash

RE='[^0-9]*\([0-9]*\)[.]\([0-9]*\)[.]\([0-9]*\)\([0-9A-Za-z-]*\)'

base="$1"
if [ -z "$1" ]
then
  base=$(git tag 2>/dev/null| tail -n 1)
  if [ -z "$base" ]
  then
    base=0.0.0
  fi
fi

msgs=$(git log --format=%B $(git tag 2>/dev/null| tail -n 1)..HEAD)

chglevel=0
while MSG= read -r line; do
	msg=`expr "$line" : '^\(.*\):.*'`
	case $msg in
		fix) 
                  [[ $chglevel -le 1 ]] && chglevel=1;;
		feat) 
                  [[ $chglevel -le 2 ]] && chglevel=2;;
		*\!) 
                  chglevel=3;;
	esac
done <<< "$msgs"


MAJOR=`echo $base | sed -e "s#$RE#\1#"`
MINOR=`echo $base | sed -e "s#$RE#\2#"`
PATCH=`echo $base | sed -e "s#$RE#\3#"`

case "$chglevel" in
  3)
    let MAJOR+=1
    let MINOR=0
    let PATCH=0
    ;;
  2)
    let MINOR+=1
    let PATCH=0  
    ;;
  1)
    let PATCH+=1
    ;;
esac

echo "$MAJOR $MINOR $PATCH"

