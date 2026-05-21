---
title: Prepare the BigIPs
layout: default
parent: Installation
nav_order: 1
---

# Prepare the BigIPs

BigIPReport needs a BIG-IP account that can read configuration from every device in the report. This step is common to all installation methods.

Do not use `admin`, `root`, or a personal administrator account. Create a dedicated report user with read-only permissions instead.

## 1. Choose the permissions

The report user should have:

- Role: Auditor
- Partition Access: All
- Terminal Access: Disabled

Use the same username and password on all BIG-IP devices that BigIPReport will poll. If you use external authentication, make sure the external account maps to the same effective permissions.

## 2. Create a local user

Create a local user via the management interface or via the shell:

```shell
tmsh create auth user bigipreport \
  password 'change-this-password' \
  partition-access add { all-partitions { role auditor } } \
  shell none

tmsh save sys config
```

Replace `bigipreport` and `change-this-password` with the username and password you want to use.

## 3. Consider management resources

BigIPReport uses the BIG-IP management API and consumes management-plane resources while it collects data. Keep an eye on management CPU, memory, and responsiveness after enabling polling, especially in larger installations or when polling many devices and partitions.

If the BIG-IP management interface becomes slow, API calls take longer than expected, or management memory pressure increases, try allocating more memory to the BIG-IP management interface. F5 documents the procedure in [K26427018: Provisioning extra memory to the management module](https://my.f5.com/manage/s/article/K26427018).

## 4. Verify access

Before continuing, verify that the report user can sign in to the BIG-IP management interface and see the partitions and objects you expect BigIPReport to include.

The server running BigIPReport must also be able to reach the BIG-IP management interfaces over HTTPS.
