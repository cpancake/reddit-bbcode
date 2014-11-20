STYLE=$(shell stylus -c -p common.styl | sed -e s/^%%/^%%^%%/g)

all:
	sed "s/\$$STYLE\$$/$(STYLE)/" reddit-bbcode.js > reddit-bbcode.user.js

clean:
	rm -rf common.css
	rm -rf reddit-bbcode.user.js