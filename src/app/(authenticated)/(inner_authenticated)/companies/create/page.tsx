import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CreateCompanyForm from "@/components/companies/CreateCompanyForm";
import styles from "@/styles/pages/companies/create-company.module.scss";

export default async function CreateCompanyPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h1>Create a company</h1>
                    <p>Set up your company workspace. You can invite teammates after creation.</p>
                </div>
                <CreateCompanyForm />
            </div>
        </div>
    );
}
