-- Certifications
CREATE policy "Organizations can view users certification details"
ON "public"."certifications"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE policy "Users can fully access and manipulate all their certifications data"
ON "public"."certifications"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Education_history
CREATE policy "Users can fully access and manipulate all their education data"
ON "public"."education_history"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE policy "Organizations can view users education details"
ON "public"."education_history"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Jobseeker_skill_rating
CREATE policy "Organizations and users can view users skill scores"
ON "public"."jobseeker_skill_rating"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- matches

-- organization_details
CREATE policy "Organizations can access and manipulate all their own data"
ON "public"."organization_details"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (organization_id = auth.uid())
WITH CHECK (organization_id = auth.uid());

CREATE policy "Users can view employer and job details"
ON "public"."organization_details"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Profile
CREATE policy "Organizations can view potential candidate details"
ON "public"."profile"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE policy "Users can fully access and manipulate all their own data"
ON "public"."profile"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Added to specify individual controls, will update others later 
-- This allows the user to SELECT their own profile
CREATE POLICY "Users can read their own profile"
ON profile
FOR SELECT
USING (auth.uid() = user_id);


-- Reference
CREATE policy "Organizations can view users reference details"
ON "public"."reference"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE policy "Users can fully access and manipulate all their reference data"
ON "public"."reference"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Socials
CREATE policy "Organizations can view users social details"
ON "public"."socials"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE policy "Users can fully access and manipulate all their socials data"
ON "public"."socials"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Work_experience
CREATE policy "Organizations can view users work history details"
ON "public"."work_experience"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE policy "Users can fully access and manipulate all their work history data"
ON "public"."work_experience"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


