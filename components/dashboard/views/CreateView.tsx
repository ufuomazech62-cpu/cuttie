
import * as React from 'react';
import { StyleItem, BodyProfile } from '../../../types';
import Onboarding from '../../onboarding/Onboarding';

interface CreateViewProps {
  onGenerate: (style: StyleItem, products: string[], newProfile?: BodyProfile) => void;
  // Note: onGenerateDraft is now handled internally by Onboarding component
  onGenerateDraft?: (prompt: string) => Promise<StyleItem | null>;
  userProfile: BodyProfile;
}

const CreateView: React.FC<CreateViewProps> = ({ onGenerate, userProfile }) => {
  return (
    <div className="h-full bg-cuttie-cream">
       <Onboarding 
          isAuthenticated={true}
          initialProfile={userProfile}
          onComplete={(profile, style, products) => {
              if (style) {
                  onGenerate(style, products, profile);
              }
          }}
       />
    </div>
  );
};

export default CreateView;
