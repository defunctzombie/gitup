# gitup

gitup is a multi-server deployment tool based on git. Pushing to a git master will cause all of the clones to update their working copies and restart.

## master
To run a master (where you push your git repos), simply fire up a gitup server on an internet facing box.

```
gitup --port 3000 --secret foobar --git-user foo
```

You can now push to this server from your project directory via git:

```
git push http://foo:foobar@hostname:3000/repo-name master
```

## clone

A clone is another server which will keep the git repo up to date based on the master git repo. Whenever you push to the master, the clones all update.

```
gitup clone http://user:pass@hostname:port/repo dest
```
