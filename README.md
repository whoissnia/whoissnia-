# whoissnia — Y2K Glossy

Site de liens sociaux avec espace visiteur public et espace administrateur privé.
Stack : HTML/CSS/JS + Supabase Auth/Database + Vercel (hébergement statique).

## 1. Créer le projet Supabase (gratuit)
1. Crée un projet sur https://supabase.com/ (Free).
2. Dans **Authentication > Users**, crée un utilisateur admin avec une adresse e-mail à toi et un mot de passe fort.
   - Le nom d'utilisateur affiché sur le site sera `whoissnia`.
   - Le mot de passe n'est pas enregistré dans les fichiers du site : il est géré par Supabase.
3. Dans **Project Settings > API**, copie le **Project URL** et la clé **anon/public** (ou publishable key).
4. Ouvre `config.js` et remplace :
   - `COLLE_ICI_TON_SUPABASE_PROJECT_URL`
   - `COLLE_ICI_TA_CLE_PUBLISHABLE_OU_ANON`
   - `REMPLACE_PAR_LE_MAIL_ADMIN_CREE_DANS_SUPABASE` par l'adresse utilisée à l'étape 2.
5. Dans **SQL Editor**, ouvre `supabase/schema.sql`, colle son contenu et exécute-le.
6. Dans **Authentication > Users**, copie l'ID UUID de ton compte admin.
7. Dans **SQL Editor**, exécute cette requête en remplaçant l'UUID :
   ```sql
   insert into public.site_admins (user_id)
   values ('COLLE-ICI-UUID-ADMIN');
   ```

## 2. Mettre le site en ligne gratuitement avec Vercel
1. Crée un compte sur https://vercel.com/ (gratuit).
2. Crée un dépôt GitHub et ajoute tous les fichiers de ce dossier à la racine du dépôt.
3. Dans Vercel, clique **Add New > Project**, importe ce dépôt GitHub.
4. Framework preset : **Other**. Build command : laisser vide. Output directory : `.` (ou laisser la valeur par défaut si Vercel détecte le site statique).
5. Clique **Deploy**. Vercel te donne une adresse publique `....vercel.app`.
6. Chaque mise à jour envoyée sur GitHub sera redéployée automatiquement.

## 3. Utiliser le site
- Visiteurs : ouvrent simplement l'adresse Vercel.
- Admin : bouton **ADMIN**, identifiant `whoissnia`, puis le mot de passe défini dans Supabase.
- Dans le tableau de bord : modifier le profil, ajouter/modifier/supprimer les liens et changer leur ordre.

## Sécurité — à lire
- Ne mets jamais le mot de passe dans `config.js`, GitHub ou un fichier du site.
- La clé `anon` / `publishable` est conçue pour être publique. La sécurité des données repose sur les règles RLS du fichier SQL.
- N'utilise jamais la clé `service_role` dans le navigateur.
- Le compte Supabase doit être le seul utilisateur ajouté à `site_admins`.
- Si le mot de passe déjà communiqué dans une conversation est utilisé ailleurs, change-le et choisis un mot de passe unique.
- Le site ne peut pas être publié automatiquement depuis ce paquet : il faut connecter tes comptes Supabase, GitHub et Vercel en suivant les étapes ci-dessus.

## Dépannage
- « Configuration manquante » : vérifie les 3 valeurs de `config.js` puis recharge.
- Connexion refusée : vérifie l'adresse admin configurée et le mot de passe de l'utilisateur Supabase.
- Accès refusé dans le dashboard : vérifie que l'UUID du compte est bien présent dans `site_admins`.
- Les liens n'apparaissent pas : vérifie que le script SQL a bien été exécuté et que `is_visible` vaut `true`.
